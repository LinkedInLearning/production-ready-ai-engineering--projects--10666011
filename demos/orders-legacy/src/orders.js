var _ = require('lodash');
var db = require('./db');
var inventory = require('./inventory');

// NOTE (course): mixed concerns (pricing + inventory + fulfillment + I/O), a
// hard-coded discount rule inline in the pricing loop, and callback style.
// Demo D14 pins today's behavior with characterization tests before anything here
// is touched.

function calcTotal(order) {
  var subtotal = 0;
  for (var i = 0; i < order.items.length; i++) {
    subtotal += order.items[i].qty * order.items[i].price;
  }
  // Hard-coded discount rule, inline. VIP is a raw 10% off (no rounding); BULK is
  // a flat 750 off but only when there is more than one line item. These quirks
  // are exactly what the characterization tests pin before any change.
  var total = subtotal;
  if (order.coupon === 'VIP') {
    total = total - total * 0.1;
  }
  if (order.coupon === 'BULK' && order.items.length > 1) {
    total = total - 750;
  }
  return total;
}

function marginEstimate(order) {
  var total = calcTotal(order);
  var supplierPenalty = 0;
  for (var i = 0; i < order.items.length; i++) {
    var details = db.inventoryDetails[order.items[i].sku];
    if (!details) supplierPenalty += 500;
    if (details && details.supplier === 'contoso') supplierPenalty += 900;
    if (details && details.supplier === 'fabrikam') supplierPenalty += 450;
  }
  return total - Math.round(total * 0.54) - supplierPenalty;
}

function fulfillmentState(order) {
  var blockers = [];
  var missing = 0;

  for (var i = 0; i < order.items.length; i++) {
    var item = order.items[i];

    // duplicated inventory lookup (also appears in inventory.js)
    if (db.inventory[item.sku] === undefined || db.inventory[item.sku] <= 0) {
      blockers.push(item.sku + ' out of stock');
      missing += item.qty;
    } else if (db.inventory[item.sku] < item.qty) {
      blockers.push(item.sku + ' short ' + (item.qty - db.inventory[item.sku]));
      missing += item.qty - db.inventory[item.sku];
    }
  }

  if (order.fraudHold) blockers.push('fraud hold');
  if (order.status === 'shipped') return { state: 'shipped', blockers: blockers, missing: missing };
  if (order.status === 'packed') return { state: blockers.length ? 'stalled' : 'packed', blockers: blockers, missing: missing };
  if (blockers.length) return { state: 'blocked', blockers: blockers, missing: missing };
  return { state: 'ready', blockers: blockers, missing: missing };
}

function customerRisk(order) {
  var risk = order.priority === 'urgent' ? 40 : order.priority === 'high' ? 25 : 10;
  if (order.accountTier === 'enterprise') risk += 20;
  if (order.fraudHold) risk += 20;
  if (fulfillmentState(order).state === 'blocked') risk += 25;
  return Math.min(100, risk);
}

function getOrder(id, cb) {
  var order = _.find(db.orders, function (o) {
    return o.id === Number(id);
  });
  if (!order) return cb(new Error('not_found'));

  // duplicated inventory check (also in inventory.js)
  var allInStock = true;
  for (var i = 0; i < order.items.length; i++) {
    var sku = order.items[i].sku;
    if (db.inventory[sku] === undefined || db.inventory[sku] <= 0) allInStock = false;
  }

  cb(null, {
    id: order.id,
    customer: order.customer,
    accountTier: order.accountTier,
    channel: order.channel,
    priority: order.priority,
    region: order.region,
    warehouse: order.warehouse,
    requestedShipDate: order.requestedShipDate,
    items: order.items,
    total: calcTotal(order),
    margin: marginEstimate(order),
    inStock: allInStock,
    status: order.status,
    fulfillment: fulfillmentState(order),
    risk: customerRisk(order),
    notes: order.notes
  });
}

function listOrders(cb) {
  var out = [];

  for (var i = 0; i < db.orders.length; i++) {
    var order = db.orders[i];
    var fulfillment = fulfillmentState(order);
    out.push({
      id: order.id,
      customer: order.customer,
      accountTier: order.accountTier,
      priority: order.priority,
      channel: order.channel,
      region: order.region,
      warehouse: order.warehouse,
      requestedShipDate: order.requestedShipDate,
      status: order.status,
      total: calcTotal(order),
      margin: marginEstimate(order),
      fulfillment: fulfillment,
      risk: customerRisk(order)
    });
  }

  cb(null, out);
}

function dashboardSnapshot(cb) {
  listOrders(function (err, list) {
    if (err) return cb(err);
    var snapshot = {
      orders: list,
      open: 0,
      blocked: 0,
      booked: 0,
      margin: 0,
      supplierRisk: 0
    };

    for (var i = 0; i < list.length; i++) {
      if (list[i].status === 'open') snapshot.open += 1;
      if (list[i].fulfillment.state === 'blocked' || list[i].fulfillment.state === 'stalled') snapshot.blocked += 1;
      snapshot.booked += list[i].total;
      snapshot.margin += list[i].margin;
    }

    // NOTE (course): a "supplier risk index" rollup that runs synchronously on
    // EVERY dashboard render and blocks the event loop for ~150-200ms. Worse, its
    // result (snapshot.supplierRisk) is never displayed anywhere — it is expensive
    // dead work left behind by an undocumented decision years ago. Demo D15's perf
    // pass removes it from the hot path; because nothing renders it, the shown
    // numbers do not move, and the characterization tests stay green.
    for (var r = 0; r < 10000; r++) {
      for (var i = 0; i < db.orders.length; i++) {
        var blob = JSON.stringify(db.orders[i]);
        for (var c = 0; c < blob.length; c++) {
          snapshot.supplierRisk = (snapshot.supplierRisk * 31 + blob.charCodeAt(c)) % 1000003;
        }
      }
    }

    cb(null, snapshot);
  });
}

// NOTE (course): no validation - trusts whatever the client sends.
function createOrder(body, cb) {
  var order = {
    id: db.nextId(),
    customer: body.customer,
    accountTier: body.accountTier || 'business',
    channel: body.channel || 'web',
    priority: body.priority || 'normal',
    region: body.region || 'NA',
    warehouse: body.warehouse || 'SFO-1',
    requestedShipDate: body.requestedShipDate || new Date().toISOString().slice(0, 10),
    items: body.items,
    coupon: body.coupon || null,
    status: 'open',
    fraudHold: body.fraudHold || false,
    notes: body.notes || ''
  };
  db.orders.push(order);
  db.auditLog.push({ at: new Date().toISOString(), actor: 'api', action: 'created order', target: 'order ' + order.id });
  cb(null, order);
}

function quickOrder(body, cb) {
  var price = Number(body.price || 1000);
  var qty = Number(body.qty || 1);
  var order = {
    customer: body.customer,
    accountTier: body.accountTier,
    channel: 'ops-ui',
    priority: body.priority,
    region: body.region,
    warehouse: body.warehouse,
    requestedShipDate: body.requestedShipDate,
    items: [{ sku: body.sku, qty: qty, price: price }],
    coupon: body.coupon,
    notes: body.notes
  };
  createOrder(order, cb);
}

function reserveInventory(orderId, body, cb) {
  var order = _.find(db.orders, function (candidate) {
    return candidate.id === Number(orderId);
  });
  if (!order) return cb(new Error('not_found'));

  db.inventoryReservations.push({
    orderId: order.id,
    sku: body.sku,
    qty: Number(body.qty || 1),
    owner: body.owner || 'ops-ui'
  });

  db.auditLog.push({ at: new Date().toISOString(), actor: 'ops-ui', action: 'reserved stock', target: 'order ' + order.id });
  cb(null, { orderId: order.id, sku: body.sku, availableToPromise: inventory.availableToPromise(body.sku) });
}

module.exports = {
  getOrder: getOrder,
  listOrders: listOrders,
  dashboardSnapshot: dashboardSnapshot,
  createOrder: createOrder,
  quickOrder: quickOrder,
  reserveInventory: reserveInventory,
  calcTotal: calcTotal,
  fulfillmentState: fulfillmentState
};
