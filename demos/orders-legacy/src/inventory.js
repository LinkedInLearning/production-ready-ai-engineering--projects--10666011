var db = require('./db');

// NOTE (course): inventory logic is duplicated between here and orders.js, and
// reads shared mutable state. Demo D14 pins this behavior with characterization
// tests before any change.

function inStock(sku) {
  // duplicated lookup logic (also appears in orders.js)
  if (db.inventory[sku] === undefined) return false;
  return db.inventory[sku] > 0;
}

function available(sku) {
  if (db.inventory[sku] === undefined) return 0;
  return db.inventory[sku];
}

function reserved(sku) {
  var total = 0;
  for (var i = 0; i < db.inventoryReservations.length; i++) {
    if (db.inventoryReservations[i].sku === sku) total += db.inventoryReservations[i].qty;
  }
  return total;
}

function availableToPromise(sku) {
  if (db.inventory[sku] === undefined) return 0;
  return db.inventory[sku] - reserved(sku);
}

function reorderStatus(sku) {
  var details = db.inventoryDetails[sku];
  if (!details) return 'unknown';
  if (availableToPromise(sku) <= 0) return 'blocked';
  if (availableToPromise(sku) <= details.reorderPoint) return 'watch';
  return 'ready';
}

module.exports = {
  inStock: inStock,
  available: available,
  reserved: reserved,
  availableToPromise: availableToPromise,
  reorderStatus: reorderStatus
};
