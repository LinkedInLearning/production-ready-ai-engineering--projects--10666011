var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var orders = require('./orders');
var inventory = require('./inventory');
var db = require('./db');

// NOTE (course): secrets read straight from env with no validation, no logging,
// no metrics. Demos D14/D15 add gates, observability, and structure.
var API_TOKEN = process.env.API_TOKEN;

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/assets', express.static(path.join(__dirname, '..', 'public')));

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeClass(value) {
  return String(value || 'unknown').replace(/[^a-z0-9_-]/gi, '-').toLowerCase();
}

function money(cents) {
  return '$' + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function rawOrder(id) {
  return db.orders.filter(function (candidate) { return candidate.id === id; })[0];
}

function supplierForSku(sku) {
  var details = db.inventoryDetails[sku];
  if (!details) return null;
  return db.suppliers.filter(function (supplier) { return supplier.id === details.supplier; })[0] || null;
}

function renderDashboard(snapshot) {
  var orderList = snapshot.orders;
  var blockedSkus = Object.keys(db.inventory).filter(function (sku) {
    return inventory.availableToPromise(sku) <= 0;
  });

  var orderRows = orderList.map(function (order) {
    var raw = rawOrder(order.id) || {};
    var blockers = order.fulfillment.blockers.length ? order.fulfillment.blockers.join(', ') : 'none';
    return '<tr>' +
      '<td><a href="/orders/' + order.id + '">#' + order.id + '</a><small>' + escapeHtml(order.requestedShipDate) + '</small></td>' +
      '<td><strong>' + escapeHtml(order.customer) + '</strong><small>' + escapeHtml(order.accountTier) + ' | ' + escapeHtml(order.region) + '</small></td>' +
      '<td><span class="pill pill--' + safeClass(order.priority) + '">' + escapeHtml(order.priority) + '</span><small>' + escapeHtml(order.channel) + '</small></td>' +
      '<td><span class="pill pill--' + safeClass(order.fulfillment.state) + '">' + escapeHtml(order.fulfillment.state) + '</span><small>' + escapeHtml(blockers) + '</small></td>' +
      '<td><small>' + escapeHtml(raw.warehouse || order.warehouse) + '</small></td>' +
      '<td class="num">' + money(order.total) + '<small>' + money(order.margin) + ' margin</small></td>' +
      '</tr>';
  }).join('');

  var inventoryRows = Object.keys(db.inventory).map(function (sku) {
    var details = db.inventoryDetails[sku] || {};
    var available = inventory.available(sku);
    var reserved = inventory.reserved(sku);
    var atp = inventory.availableToPromise(sku);
    var status = inventory.reorderStatus(sku);
    var supplier = supplierForSku(sku);
    var width = Math.max(8, Math.min(100, atp * 9));
    return '<li class="inventory-item inventory-item--' + safeClass(status) + '">' +
      '<div><strong>' + escapeHtml(sku) + '</strong><span>' + escapeHtml(details.name || 'unknown item') + '</span></div>' +
      '<div class="meter"><span style="width:' + width + '%"></span></div>' +
      '<b>' + atp + '</b>' +
      '<small>' + available + ' on hand | ' + reserved + ' held | ' + escapeHtml(supplier ? supplier.name : 'no supplier') + '</small>' +
      '</li>';
  }).join('');

  var shipmentRows = db.shipments.map(function (shipment) {
    return '<tr>' +
      '<td>' + escapeHtml(shipment.id) + '<small>order #' + shipment.orderId + '</small></td>' +
      '<td>' + escapeHtml(shipment.carrier) + '</td>' +
      '<td><span class="pill pill--' + safeClass(shipment.status) + '">' + escapeHtml(shipment.status) + '</span></td>' +
      '<td>' + escapeHtml(shipment.eta) + '</td>' +
      '<td>' + escapeHtml(shipment.warehouse) + '</td>' +
      '</tr>';
  }).join('');

  var supplierRows = db.suppliers.map(function (supplier) {
    return '<li class="supplier supplier--' + safeClass(supplier.risk) + '">' +
      '<div><strong>' + escapeHtml(supplier.name) + '</strong><span>' + escapeHtml(supplier.contact) + '</span></div>' +
      '<b>' + escapeHtml(supplier.risk) + '</b>' +
      '<small>' + supplier.leadDays + ' day lead</small>' +
      '</li>';
  }).join('');

  var auditRows = db.auditLog.slice().reverse().slice(0, 6).map(function (item) {
    return '<li><span>' + escapeHtml(item.actor) + '</span><b>' + escapeHtml(item.action) + '</b><small>' + escapeHtml(item.target) + '</small></li>';
  }).join('');

  var returnRows = db.returns.map(function (item) {
    return '<li><span>' + escapeHtml(item.id) + '</span><b>' + escapeHtml(item.status) + '</b><small>' + escapeHtml(item.reason) + '</small></li>';
  }).join('');

  var skuOptions = Object.keys(db.inventory).map(function (sku) {
    return '<option value="' + escapeHtml(sku) + '">' + escapeHtml(sku) + ' - ' + escapeHtml(db.inventoryDetails[sku].name) + '</option>';
  }).join('');

  return '<!doctype html>' +
    '<html lang="en">' +
    '<head>' +
      '<meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">' +
      '<title>Orders Legacy Operations</title>' +
      '<link rel="stylesheet" href="/assets/styles.css">' +
    '</head>' +
    '<body>' +
      '<div class="shell">' +
        '<aside class="sidebar">' +
          '<div class="brand"><span class="brand-mark">OL</span><div><strong>Orders Legacy</strong><small>Brownfield console</small></div></div>' +
          '<nav><a href="/">Dashboard</a><a href="/orders">Orders API</a><a href="/shipments">Shipments API</a><a href="/inventory/A1">Inventory API</a></nav>' +
          '<div class="system-card"><span>Runtime</span><strong>Express 4</strong><small>' + (API_TOKEN ? 'API token configured' : 'API token missing') + '</small></div>' +
        '</aside>' +
        '<main class="dashboard">' +
          '<section class="hero">' +
            '<div class="hero-copy">' +
              '<span class="eyebrow">Inventory and order operations</span>' +
              '<h1>Fulfillment is moving, but the floor is uneven.</h1>' +
              '<p>Orders, stock, supplier risk, returns, and audit events share one old in-memory model. It works. Now we can raise the bar carefully.</p>' +
              '<div class="hero-actions"><a class="button" href="/orders">View JSON</a><a class="button button--secondary" href="/inventory/B2">Check B2</a></div>' +
            '</div>' +
            '<img src="/assets/ops-workbench.png" alt="Warehouse operations desk with inventory dashboard">' +
          '</section>' +
          '<section class="stats">' +
            '<article><span>Open orders</span><strong>' + snapshot.open + '</strong><small>' + orderList.length + ' total records</small></article>' +
            '<article><span>Blocked work</span><strong>' + snapshot.blocked + '</strong><small>' + (blockedSkus[0] ? blockedSkus.join(', ') : 'none') + '</small></article>' +
            '<article><span>Booked value</span><strong>' + money(snapshot.booked) + '</strong><small>' + money(snapshot.margin) + ' est. margin</small></article>' +
            '<article><span>Quality floor</span><strong>low</strong><small>ready to ratchet</small></article>' +
          '</section>' +
          '<section class="ops-grid">' +
            '<article class="panel panel--orders">' +
              '<div class="panel-head"><div><span class="eyebrow">Orders</span><h2>Fulfillment queue</h2></div><span class="freshness">seed data</span></div>' +
              '<table><thead><tr><th>Order</th><th>Customer</th><th>Priority</th><th>Fulfillment</th><th>Warehouse</th><th class="num">Total</th></tr></thead><tbody>' + orderRows + '</tbody></table>' +
            '</article>' +
            '<article class="panel panel--intake">' +
              '<div class="panel-head"><div><span class="eyebrow">Ops intake</span><h2>Quick order</h2></div></div>' +
              '<form method="post" action="/quick-order">' +
                '<label>Customer<input name="customer" value="demo-account"></label>' +
                '<label>SKU<select name="sku">' + skuOptions + '</select></label>' +
                '<label>Quantity<input name="qty" value="1"></label>' +
                '<label>Unit price cents<input name="price" value="1000"></label>' +
                '<label>Priority<select name="priority"><option>normal</option><option>high</option><option>urgent</option></select></label>' +
                '<label>Warehouse<input name="warehouse" value="SFO-1"></label>' +
                '<button class="button" type="submit">Create order</button>' +
              '</form>' +
            '</article>' +
            '<article class="panel panel--inventory">' +
              '<div class="panel-head"><div><span class="eyebrow">Inventory</span><h2>Available to promise</h2></div></div>' +
              '<ul class="inventory-list">' + inventoryRows + '</ul>' +
            '</article>' +
            '<article class="panel">' +
              '<div class="panel-head"><div><span class="eyebrow">Shipments</span><h2>Exceptions</h2></div></div>' +
              '<table class="compact"><thead><tr><th>Shipment</th><th>Carrier</th><th>Status</th><th>ETA</th><th>Warehouse</th></tr></thead><tbody>' + shipmentRows + '</tbody></table>' +
            '</article>' +
            '<article class="panel">' +
              '<div class="panel-head"><div><span class="eyebrow">Suppliers</span><h2>Lead time risk</h2></div></div>' +
              '<ul class="supplier-list">' + supplierRows + '</ul>' +
            '</article>' +
            '<article class="panel panel--risk">' +
              '<span class="eyebrow">Brownfield risk</span>' +
              '<h2>Why this app exists</h2>' +
              '<ul class="risk-list">' +
                '<li><b>No characterization tests</b><span>Pricing, fulfillment, and reservations are not pinned yet.</span></li>' +
                '<li><b>Shared mutable state</b><span>db.js exports live arrays and objects.</span></li>' +
                '<li><b>Old dependencies</b><span>Express, body-parser, and lodash are intentionally stale.</span></li>' +
                '<li><b>Validation gaps</b><span>The API and quick-order form trust client input.</span></li>' +
              '</ul>' +
            '</article>' +
            '<article class="panel">' +
              '<div class="panel-head"><div><span class="eyebrow">Returns</span><h2>Open work</h2></div></div>' +
              '<ul class="event-list">' + returnRows + '</ul>' +
            '</article>' +
            '<article class="panel">' +
              '<div class="panel-head"><div><span class="eyebrow">Audit</span><h2>Recent activity</h2></div></div>' +
              '<ul class="event-list">' + auditRows + '</ul>' +
            '</article>' +
          '</section>' +
        '</main>' +
      '</div>' +
    '</body>' +
    '</html>';
}

app.get('/', function (req, res) {
  orders.dashboardSnapshot(function (err, snapshot) {
    if (err) return res.status(500).send({ error: 'server_error' });
    res.send(renderDashboard(snapshot));
  });
});

app.get('/orders', function (req, res) {
  orders.listOrders(function (err, list) {
    if (err) return res.status(500).send({ error: 'server_error' });
    res.send(list);
  });
});

app.get('/orders/:id', function (req, res) {
  orders.getOrder(req.params.id, function (err, order) {
    if (err) return res.status(404).send({ error: 'not_found' });
    res.send(order);
  });
});

// NO input validation (intentional).
app.post('/orders', function (req, res) {
  orders.createOrder(req.body, function (err, order) {
    if (err) return res.status(500).send({ error: 'server_error' });
    res.send(order);
  });
});

// NO input validation (intentional), but convenient for the UI demo.
app.post('/quick-order', function (req, res) {
  orders.quickOrder(req.body, function (err) {
    if (err) return res.status(500).send({ error: 'server_error' });
    res.redirect('/');
  });
});

app.post('/orders/:id/reserve', function (req, res) {
  orders.reserveInventory(req.params.id, req.body, function (err, reservation) {
    if (err) return res.status(404).send({ error: 'not_found' });
    res.send(reservation);
  });
});

app.get('/inventory/:sku', function (req, res) {
  var sku = req.params.sku;
  res.send({
    sku: sku,
    inStock: inventory.inStock(sku),
    available: inventory.available(sku),
    reserved: inventory.reserved(sku),
    availableToPromise: inventory.availableToPromise(sku),
    reorderStatus: inventory.reorderStatus(sku),
    details: db.inventoryDetails[sku] || null
  });
});

app.get('/shipments', function (req, res) {
  res.send(db.shipments);
});

app.get('/suppliers', function (req, res) {
  res.send(db.suppliers);
});

app.get('/returns', function (req, res) {
  res.send(db.returns);
});

app.get('/audit-log', function (req, res) {
  res.send(db.auditLog);
});

var port = process.env.PORT || 4000;
app.listen(port, function () {
  console.log('orders-legacy listening on ' + port + (API_TOKEN ? '' : ' (warning: API_TOKEN not set)'));
});
