// In-memory "database". No abstraction boundary - callers reach in directly.
// NOTE (course): shared mutable state with no boundary. Demo D14 pins the
// behavior that reads it; Demo D15 adds validation at the write boundary.

var orders = [
  {
    id: 1,
    customer: 'acme',
    accountTier: 'enterprise',
    channel: 'sales',
    priority: 'high',
    region: 'NA',
    warehouse: 'SFO-1',
    requestedShipDate: '2026-07-05',
    items: [{ sku: 'A1', qty: 2, price: 1000 }, { sku: 'C3', qty: 1, price: 2600 }],
    coupon: null,
    status: 'open',
    fraudHold: false,
    notes: 'Board demo kit. Customer asked for confirmation before Friday.'
  },
  {
    id: 2,
    customer: 'globex',
    accountTier: 'business',
    channel: 'web',
    priority: 'normal',
    region: 'EMEA',
    warehouse: 'AMS-2',
    requestedShipDate: '2026-07-06',
    items: [{ sku: 'B2', qty: 1, price: 4500 }],
    coupon: 'VIP',
    status: 'open',
    fraudHold: false,
    notes: 'VIP discount is still applied inside pricing code.'
  },
  {
    id: 3,
    customer: 'initech',
    accountTier: 'startup',
    channel: 'partner',
    priority: 'low',
    region: 'NA',
    warehouse: 'SFO-1',
    requestedShipDate: '2026-07-01',
    items: [{ sku: 'A1', qty: 5, price: 1000 }],
    coupon: null,
    status: 'shipped',
    fraudHold: false,
    notes: 'Shipped before the migration window.'
  },
  {
    id: 4,
    customer: 'umbrella',
    accountTier: 'enterprise',
    channel: 'api',
    priority: 'urgent',
    region: 'NA',
    warehouse: 'ATL-3',
    requestedShipDate: '2026-07-03',
    items: [{ sku: 'D4', qty: 8, price: 1750 }, { sku: 'E5', qty: 2, price: 6200 }],
    coupon: 'BULK',
    status: 'open',
    fraudHold: true,
    notes: 'Fraud hold and stock split across warehouses. High-touch account.'
  },
  {
    id: 5,
    customer: 'stark',
    accountTier: 'enterprise',
    channel: 'api',
    priority: 'high',
    region: 'NA',
    warehouse: 'SFO-1',
    requestedShipDate: '2026-07-04',
    items: [{ sku: 'F6', qty: 4, price: 3100 }, { sku: 'A1', qty: 1, price: 1000 }],
    coupon: null,
    status: 'open',
    fraudHold: false,
    notes: 'Webhook-created order. Duplicate risk if retries are not idempotent.'
  },
  {
    id: 6,
    customer: 'wayne',
    accountTier: 'business',
    channel: 'web',
    priority: 'normal',
    region: 'NA',
    warehouse: 'ATL-3',
    requestedShipDate: '2026-07-07',
    items: [{ sku: 'G7', qty: 12, price: 850 }],
    coupon: 'VIP',
    status: 'packed',
    fraudHold: false,
    notes: 'Packed but carrier label failed once.'
  },
  {
    id: 7,
    customer: 'tyrell',
    accountTier: 'enterprise',
    channel: 'sales',
    priority: 'high',
    region: 'APAC',
    warehouse: 'SIN-1',
    requestedShipDate: '2026-07-08',
    items: [{ sku: 'H8', qty: 3, price: 7900 }, { sku: 'C3', qty: 4, price: 2600 }],
    coupon: null,
    status: 'open',
    fraudHold: false,
    notes: 'Supplier delay expected. Sales promised expedited handling.'
  },
  {
    id: 8,
    customer: 'wonka',
    accountTier: 'business',
    channel: 'web',
    priority: 'normal',
    region: 'EMEA',
    warehouse: 'AMS-2',
    requestedShipDate: '2026-07-09',
    items: [{ sku: 'E5', qty: 1, price: 6200 }, { sku: 'B2', qty: 2, price: 4500 }],
    coupon: null,
    status: 'open',
    fraudHold: false,
    notes: 'Accessibility procurement review asks for invoice copy before shipment.'
  }
];

var inventory = { A1: 12, B2: 0, C3: 7, D4: 5, E5: 2, F6: 4, G7: 18, H8: 1 };

var inventoryDetails = {
  A1: { name: 'Starter terminal', location: 'SFO-1-A3', reorderPoint: 5, supplier: 'northwind' },
  B2: { name: 'Pro scanner', location: 'AMS-2-B1', reorderPoint: 3, supplier: 'contoso' },
  C3: { name: 'Thermal label pack', location: 'SFO-1-C7', reorderPoint: 8, supplier: 'northwind' },
  D4: { name: 'Countertop kiosk', location: 'ATL-3-D2', reorderPoint: 4, supplier: 'fabrikam' },
  E5: { name: 'Secure cash drawer', location: 'AMS-2-E2', reorderPoint: 2, supplier: 'fabrikam' },
  F6: { name: 'Webhook gateway', location: 'SFO-1-F5', reorderPoint: 3, supplier: 'contoso' },
  G7: { name: 'Receipt printer', location: 'ATL-3-G4', reorderPoint: 6, supplier: 'northwind' },
  H8: { name: 'Regional compliance pack', location: 'SIN-1-H1', reorderPoint: 3, supplier: 'contoso' }
};

var inventoryReservations = [
  { orderId: 4, sku: 'D4', qty: 3, owner: 'fraud-review' },
  { orderId: 5, sku: 'F6', qty: 2, owner: 'api-worker' },
  { orderId: 7, sku: 'H8', qty: 1, owner: 'sales-ops' }
];

var shipments = [
  { id: 'S-9001', orderId: 3, carrier: 'UPS', status: 'delivered', eta: '2026-07-02', warehouse: 'SFO-1' },
  { id: 'S-9002', orderId: 6, carrier: 'DHL', status: 'label_failed', eta: '2026-07-04', warehouse: 'ATL-3' },
  { id: 'S-9003', orderId: 8, carrier: 'DPD', status: 'waiting_invoice', eta: '2026-07-09', warehouse: 'AMS-2' }
];

var suppliers = [
  { id: 'northwind', name: 'Northwind Parts', risk: 'low', leadDays: 3, contact: 'ops@northwind.example' },
  { id: 'contoso', name: 'Contoso Logistics', risk: 'high', leadDays: 12, contact: 'expedite@contoso.example' },
  { id: 'fabrikam', name: 'Fabrikam Industrial', risk: 'medium', leadDays: 7, contact: 'desk@fabrikam.example' }
];

var returns = [
  { id: 'R-7101', orderId: 2, status: 'requested', reason: 'wrong total on invoice' },
  { id: 'R-7102', orderId: 6, status: 'waiting_label', reason: 'label retry failed' }
];

var auditLog = [
  { at: '2026-07-03T07:12:00Z', actor: 'batch-job', action: 'imported web orders', target: 'orders' },
  { at: '2026-07-03T08:02:00Z', actor: 'sales-ops', action: 'raised priority', target: 'order 7' },
  { at: '2026-07-03T09:44:00Z', actor: 'api-worker', action: 'reserved F6 stock', target: 'order 5' },
  { at: '2026-07-03T10:18:00Z', actor: 'fraud-review', action: 'placed hold', target: 'order 4' },
  { at: '2026-07-03T11:05:00Z', actor: 'warehouse', action: 'label generation failed', target: 'shipment S-9002' }
];

// Shared mutable state, exported directly (intentional smell).
module.exports = {
  orders: orders,
  inventory: inventory,
  inventoryDetails: inventoryDetails,
  inventoryReservations: inventoryReservations,
  shipments: shipments,
  suppliers: suppliers,
  returns: returns,
  auditLog: auditLog,
  nextId: function () {
    var max = 0;
    for (var i = 0; i < orders.length; i++) {
      if (orders[i].id > max) max = orders[i].id;
    }
    return max + 1;
  }
};
