// In-memory data storage (NO localStorage or sessionStorage)
let customers = [];
let products = [
  { id: 1, name: 'Chair', unit: 'pieces', price: 1200, sku: 'CH001' },
  { id: 2, name: 'Table', unit: 'pieces', price: 2500, sku: 'TB001' },
  { id: 3, name: 'Carpet', unit: 'sq.ft', price: 50, sku: 'CP001' },
  { id: 4, name: 'Tile', unit: 'sq.ft', price: 120, sku: 'TL001' },
  { id: 5, name: 'Cushion', unit: 'pieces', price: 400, sku: 'CS001' }
];
let orders = [];
let quotations = [];
let messageLog = [];
let billingCycles = [];
let reminders = [];

const COMPANY_NAME = 'Pooja Graphic';
const CURRENCY = '₹';

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  initializeNavigation();
  renderProducts();
  updateDashboard();
  updateCustomerSelects();
  setCurrentDateTime();
});

// Navigation
function initializeNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const viewName = link.getAttribute('data-view');
      switchView(viewName);
      
      // Update active state
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  });
}

function switchView(viewName) {
  const views = document.querySelectorAll('.view');
  views.forEach(view => view.classList.remove('active'));
  
  const targetView = document.getElementById(`${viewName}-view`);
  if (targetView) {
    targetView.classList.add('active');
    
    // Refresh data when switching to certain views
    if (viewName === 'dashboard') updateDashboard();
    if (viewName === 'customers') renderCustomers();
    if (viewName === 'orders') renderOrders();
    if (viewName === 'create-order') {
      updateCustomerSelects();
      clearOrderForm();
    }
  }
}

// Toast notifications
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Customer Management
function openAddCustomerModal() {
  document.getElementById('add-customer-modal').classList.add('show');
}

function closeAddCustomerModal() {
  document.getElementById('add-customer-modal').classList.remove('show');
  document.getElementById('add-customer-form').reset();
  document.getElementById('phone-error').textContent = '';
}

document.getElementById('add-customer-form').addEventListener('submit', (e) => {
  e.preventDefault();
  
  const name = document.getElementById('customer-name').value.trim();
  const phone = document.getElementById('customer-phone').value.trim();
  const email = document.getElementById('customer-email').value.trim();
  const notes = document.getElementById('customer-notes').value.trim();
  
  // Validate phone number
  if (!/^[0-9]{10}$/.test(phone)) {
    document.getElementById('phone-error').textContent = 'Please enter a valid 10-digit phone number';
    return;
  }
  
  const customer = {
    id: Date.now(),
    name,
    phone,
    email,
    notes,
    whatsapp_status: 'Not Connected',
    created_at: new Date().toISOString()
  };
  
  customers.push(customer);
  closeAddCustomerModal();
  showToast('Customer added successfully');
  renderCustomers();
  updateCustomerSelects();
  updateDashboard();
});

function renderCustomers() {
  const tbody = document.getElementById('customers-list');
  
  if (customers.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No customers yet</td></tr>';
    return;
  }
  
  tbody.innerHTML = customers.map(customer => `
    <tr>
      <td>${customer.name}</td>
      <td>+91 ${customer.phone}</td>
      <td>${customer.email || '-'}</td>
      <td>
        <span class="status ${customer.whatsapp_status === 'WhatsApp Connected' ? 'status--success' : 'status--info'}">
          ${customer.whatsapp_status}
        </span>
      </td>
      <td>
        <div class="action-buttons">
          <button class="btn btn--sm btn--secondary" onclick="viewCustomerOrders(${customer.id})">Orders</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function viewCustomerOrders(customerId) {
  const customer = customers.find(c => c.id === customerId);
  if (!customer) return;
  
  // Switch to orders view and filter by customer
  switchView('orders');
  document.getElementById('filter-customer').value = customerId;
  filterOrders();
  
  // Update nav
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  document.querySelector('[data-view="orders"]').classList.add('active');
}

function updateCustomerSelects() {
  const selects = ['order-customer', 'filter-customer'];
  
  selects.forEach(selectId => {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    const currentValue = select.value;
    const isFilter = selectId === 'filter-customer';
    
    select.innerHTML = isFilter 
      ? '<option value="all">All Customers</option>'
      : '<option value="">-- Select Customer --</option>';
    
    customers.forEach(customer => {
      const option = document.createElement('option');
      option.value = customer.id;
      option.textContent = `${customer.name} (+91 ${customer.phone})`;
      select.appendChild(option);
    });
    
    if (currentValue) select.value = currentValue;
  });
}

// Product Management
function openAddProductModal() {
  document.getElementById('add-product-modal').classList.add('show');
}

function closeAddProductModal() {
  document.getElementById('add-product-modal').classList.remove('show');
  document.getElementById('add-product-form').reset();
}

document.getElementById('add-product-form').addEventListener('submit', (e) => {
  e.preventDefault();
  
  const product = {
    id: Date.now(),
    name: document.getElementById('product-name').value.trim(),
    unit: document.getElementById('product-unit').value,
    price: parseFloat(document.getElementById('product-price').value)
  };
  
  products.push(product);
  closeAddProductModal();
  showToast('Product added successfully');
  renderProducts();
});

function renderProducts() {
  const tbody = document.getElementById('products-list');
  
  tbody.innerHTML = products.map(product => `
    <tr>
      <td>${product.name}</td>
      <td>${product.unit}</td>
      <td>${CURRENCY}${product.price.toFixed(2)}</td>
      <td>
        <button class="btn btn--sm btn--secondary" onclick="deleteProduct(${product.id})">Delete</button>
      </td>
    </tr>
  `).join('');
}

function deleteProduct(productId) {
  if (confirm('Are you sure you want to delete this product?')) {
    products = products.filter(p => p.id !== productId);
    renderProducts();
    showToast('Product deleted');
  }
}

// Date/Time Helpers
function setCurrentDateTime() {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().slice(0, 5);
  
  const dateInput = document.getElementById('order-date');
  const timeInput = document.getElementById('order-time');
  
  if (dateInput) dateInput.value = dateStr;
  if (timeInput) timeInput.value = timeStr;
}

function calculateDueDate() {
  const duration = parseInt(document.getElementById('credit-duration').value) || 30;
  const orderDate = document.getElementById('order-date').value;
  
  if (!orderDate) return;
  
  const date = new Date(orderDate);
  date.setDate(date.getDate() + duration);
  
  document.getElementById('due-date').value = date.toLocaleDateString('en-IN');
}

function toggleCreditFields() {
  const paymentStatus = document.querySelector('input[name="payment-status"]:checked').value;
  const creditFields = document.getElementById('credit-fields');
  
  if (paymentStatus === 'credit') {
    creditFields.style.display = 'block';
    calculateDueDate();
  } else {
    creditFields.style.display = 'none';
  }
  
  updateWhatsAppPreview();
}

function updateCreditLabel() {
  const creditType = document.getElementById('credit-type').value;
  const customLabelGroup = document.getElementById('custom-credit-label-group');
  
  if (creditType === 'custom') {
    customLabelGroup.style.display = 'block';
  } else {
    customLabelGroup.style.display = 'none';
  }
}

function toggleReminderFields() {
  const enabled = document.getElementById('enable-reminders').checked;
  const reminderFields = document.getElementById('reminder-fields');
  
  reminderFields.style.display = enabled ? 'block' : 'none';
}

// Order Creation
let orderItemCounter = 0;

function addOrderItem() {
  const container = document.getElementById('order-items-container');
  const itemId = ++orderItemCounter;
  
  const itemDiv = document.createElement('div');
  itemDiv.className = 'order-item';
  itemDiv.id = `order-item-${itemId}`;
  itemDiv.innerHTML = `
    <div class="item-header">
      <strong>Item ${itemId}</strong>
      <button type="button" class="btn btn--sm btn--secondary" onclick="removeOrderItem(${itemId})">&times; Remove</button>
    </div>
    <div class="item-fields">
      <div class="form-group">
        <label class="form-label">Product / Custom Item</label>
        <select class="form-control" onchange="fillProductDetails(${itemId})" data-item-id="${itemId}">
          <option value="">-- Select or enter custom --</option>
          <option value="custom">Custom Item</option>
          ${products.map(p => `<option value="${p.id}">${p.name} (${CURRENCY}${p.price}/${p.unit})</option>`).join('')}
        </select>
        <input type="text" class="form-control" placeholder="Custom item name" style="margin-top: 8px; display: none;" data-custom-name="${itemId}">
      </div>
      <div class="form-group">
        <label class="form-label">Quantity</label>
        <input type="number" class="form-control" min="0" step="0.01" value="1" data-quantity="${itemId}" onchange="calculateItemTotal(${itemId})" required>
      </div>
      <div class="form-group">
        <label class="form-label">Unit</label>
        <select class="form-control" data-unit="${itemId}">
          <option value="pieces">Pieces</option>
          <option value="sq.ft">Sq.ft</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Price/Unit</label>
        <input type="number" class="form-control" min="0" step="0.01" value="0" data-price="${itemId}" onchange="calculateItemTotal(${itemId})" required>
      </div>
      <div class="form-group">
        <label class="form-label">Line Total</label>
        <input type="text" class="form-control" value="${CURRENCY}0.00" data-total="${itemId}" readonly>
      </div>
    </div>
  `;
  
  container.appendChild(itemDiv);
  updateWhatsAppPreview();
}

function removeOrderItem(itemId) {
  const item = document.getElementById(`order-item-${itemId}`);
  if (item) {
    item.remove();
    calculateOrderTotal();
    updateWhatsAppPreview();
  }
}

function fillProductDetails(itemId) {
  const select = document.querySelector(`[data-item-id="${itemId}"]`);
  const customNameInput = document.querySelector(`[data-custom-name="${itemId}"]`);
  const productId = select.value;
  
  if (productId === 'custom') {
    customNameInput.style.display = 'block';
    document.querySelector(`[data-price="${itemId}"]`).value = 0;
    document.querySelector(`[data-unit="${itemId}"]`).value = 'pieces';
  } else if (productId) {
    customNameInput.style.display = 'none';
    const product = products.find(p => p.id === parseInt(productId));
    if (product) {
      document.querySelector(`[data-price="${itemId}"]`).value = product.price;
      document.querySelector(`[data-unit="${itemId}"]`).value = product.unit;
      calculateItemTotal(itemId);
    }
  } else {
    customNameInput.style.display = 'none';
  }
}

function calculateItemTotal(itemId) {
  const quantity = parseFloat(document.querySelector(`[data-quantity="${itemId}"]`).value) || 0;
  const price = parseFloat(document.querySelector(`[data-price="${itemId}"]`).value) || 0;
  const total = quantity * price;
  
  document.querySelector(`[data-total="${itemId}"]`).value = `${CURRENCY}${total.toFixed(2)}`;
  calculateOrderTotal();
  updateWhatsAppPreview();
}

function calculateOrderTotal() {
  let subtotal = 0;
  
  // Calculate subtotal from all items
  document.querySelectorAll('[data-total]').forEach(input => {
    const value = input.value.replace(CURRENCY, '');
    subtotal += parseFloat(value) || 0;
  });
  
  // Get discount
  const discountValue = parseFloat(document.getElementById('order-discount').value) || 0;
  const discountType = document.getElementById('discount-type').value;
  let discountAmount = 0;
  
  if (discountType === 'percentage') {
    discountAmount = (subtotal * discountValue) / 100;
  } else {
    discountAmount = discountValue;
  }
  
  const afterDiscount = subtotal - discountAmount;
  
  // Get tax
  const taxPercent = parseFloat(document.getElementById('order-tax').value) || 0;
  const taxAmount = (afterDiscount * taxPercent) / 100;
  
  const grandTotal = afterDiscount + taxAmount;
  
  // Update display
  document.getElementById('order-subtotal').textContent = `${CURRENCY}${subtotal.toFixed(2)}`;
  document.getElementById('order-discount-amount').textContent = `${CURRENCY}${discountAmount.toFixed(2)}`;
  document.getElementById('order-tax-amount').textContent = `${CURRENCY}${taxAmount.toFixed(2)}`;
  document.getElementById('order-grand-total').textContent = `${CURRENCY}${grandTotal.toFixed(2)}`;
  
  updateWhatsAppPreview();
}

function getOrderItems() {
  const items = [];
  const itemDivs = document.querySelectorAll('.order-item');
  
  itemDivs.forEach(div => {
    const itemId = div.id.split('-')[2];
    const select = div.querySelector(`[data-item-id="${itemId}"]`);
    const productId = select.value;
    
    let itemName = '';
    if (productId === 'custom') {
      itemName = div.querySelector(`[data-custom-name="${itemId}"]`).value.trim();
    } else if (productId) {
      const product = products.find(p => p.id === parseInt(productId));
      itemName = product ? product.name : '';
    }
    
    if (!itemName) return;
    
    const quantity = parseFloat(div.querySelector(`[data-quantity="${itemId}"]`).value) || 0;
    const unit = div.querySelector(`[data-unit="${itemId}"]`).value;
    const pricePerUnit = parseFloat(div.querySelector(`[data-price="${itemId}"]`).value) || 0;
    const lineTotal = quantity * pricePerUnit;
    
    items.push({
      name: itemName,
      quantity,
      unit,
      price_per_unit: pricePerUnit,
      line_total: lineTotal
    });
  });
  
  return items;
}

function updateWhatsAppPreview() {
  const customerId = document.getElementById('order-customer').value;
  if (!customerId) {
    document.getElementById('whatsapp-preview-text').textContent = 'Select a customer to see preview';
    return;
  }
  
  const customer = customers.find(c => c.id === parseInt(customerId));
  const items = getOrderItems();
  
  if (items.length === 0) {
    document.getElementById('whatsapp-preview-text').textContent = 'Add items to see message preview';
    return;
  }
  
  const subtotalText = document.getElementById('order-subtotal').textContent;
  const discountText = document.getElementById('order-discount-amount').textContent;
  const taxText = document.getElementById('order-tax-amount').textContent;
  const grandTotalText = document.getElementById('order-grand-total').textContent;
  const deliveryDate = document.getElementById('order-delivery-date').value || 'To be confirmed';
  const orderDate = document.getElementById('order-date').value || new Date().toISOString().split('T')[0];
  const orderTime = document.getElementById('order-time').value || new Date().toTimeString().slice(0, 5);
  
  const paymentStatus = document.querySelector('input[name="payment-status"]:checked').value;
  let creditInfo = null;
  let dueDate = null;
  
  if (paymentStatus === 'credit') {
    const creditType = document.getElementById('credit-type').value;
    const creditDuration = parseInt(document.getElementById('credit-duration').value) || 30;
    const orderDateObj = new Date(orderDate);
    dueDate = new Date(orderDateObj);
    dueDate.setDate(dueDate.getDate() + creditDuration);
    
    creditInfo = {
      label: creditType === 'custom' ? document.getElementById('custom-credit-label').value || 'Custom' : creditType,
      duration_days: creditDuration
    };
  }
  
  const message = generateWhatsAppMessage({
    customer_name: customer.name,
    order_id: 'ORD-XXXX',
    document_type: 'order',
    order_date: new Date(orderDate).toLocaleDateString('en-IN'),
    order_time: orderTime,
    items,
    subtotal: subtotalText,
    discount: discountText,
    tax: taxText,
    grand_total: grandTotalText,
    payment_status: paymentStatus,
    credit_info: creditInfo,
    due_date: dueDate ? dueDate.toISOString() : null,
    delivery_date: deliveryDate
  });
  
  document.getElementById('whatsapp-preview-text').textContent = message;
}

function generateWhatsAppMessage(data) {
  const itemsBlock = data.items.map((item, index) => 
    `${index + 1}) ${item.name} — ${item.quantity} ${item.unit} × ${CURRENCY}${item.price_per_unit} = ${CURRENCY}${item.line_total.toFixed(2)}`
  ).join('\n');
  
  let creditInfo = '';
  if (data.payment_status === 'credit' && data.credit_info) {
    creditInfo = `\n\nPayment Status: Credit (${data.credit_info.label})\nCredit Duration: ${data.credit_info.duration_days} days\nDue Date: ${new Date(data.due_date).toLocaleDateString('en-IN')}`;
  } else if (data.payment_status === 'fully_paid') {
    creditInfo = '\n\nPayment Status: Fully Paid';
  }
  
  return `Hello ${data.customer_name},

${data.document_type === 'order' ? 'Order' : 'Quotation'} ID: ${data.order_id}
Date: ${data.order_date} ${data.order_time || ''}

Items:
${itemsBlock}

Subtotal: ${data.subtotal}
Discount: ${data.discount}
Tax: ${data.tax}
Grand Total: ${data.grand_total}${creditInfo}

${data.delivery_date ? `Expected delivery: ${data.delivery_date}` : ''}

Thank you!
— ${COMPANY_NAME}`;
}

function clearOrderForm() {
  document.getElementById('order-form').reset();
  document.getElementById('order-items-container').innerHTML = '';
  orderItemCounter = 0;
  setCurrentDateTime();
  addOrderItem();
  calculateOrderTotal();
  document.getElementById('credit-fields').style.display = 'none';
  document.getElementById('reminder-fields').style.display = 'none';
  updateWhatsAppPreview();
}

document.getElementById('order-form').addEventListener('submit', (e) => {
  e.preventDefault();
  
  const customerId = parseInt(document.getElementById('order-customer').value);
  if (!customerId) {
    showToast('Please select a customer', 'error');
    return;
  }
  
  const items = getOrderItems();
  if (items.length === 0) {
    showToast('Please add at least one item', 'error');
    return;
  }
  
  const customer = customers.find(c => c.id === customerId);
  
  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.line_total, 0);
  const discountValue = parseFloat(document.getElementById('order-discount').value) || 0;
  const discountType = document.getElementById('discount-type').value;
  const discountAmount = discountType === 'percentage' ? (subtotal * discountValue) / 100 : discountValue;
  const afterDiscount = subtotal - discountAmount;
  const taxPercent = parseFloat(document.getElementById('order-tax').value) || 0;
  const taxAmount = (afterDiscount * taxPercent) / 100;
  const grandTotal = afterDiscount + taxAmount;
  
  // Payment status
  const paymentStatus = document.querySelector('input[name="payment-status"]:checked').value;
  let creditInfo = null;
  let orderReminders = [];
  let dueDate = null;
  
  if (paymentStatus === 'credit') {
    const creditType = document.getElementById('credit-type').value;
    const creditDuration = parseInt(document.getElementById('credit-duration').value) || 30;
    const orderDate = new Date(document.getElementById('order-date').value);
    dueDate = new Date(orderDate);
    dueDate.setDate(dueDate.getDate() + creditDuration);
    
    creditInfo = {
      type: creditType,
      label: creditType === 'custom' ? document.getElementById('custom-credit-label').value : creditType,
      duration_days: creditDuration
    };
    
    // Reminders
    if (document.getElementById('enable-reminders').checked) {
      if (document.getElementById('reminder-owner').checked) {
        const daysBefore = parseInt(document.getElementById('owner-reminder-days').value) || 5;
        const reminderDate = new Date(dueDate);
        reminderDate.setDate(reminderDate.getDate() - daysBefore);
        
        orderReminders.push({
          id: Date.now() + Math.random(),
          type: 'owner',
          days_before: daysBefore,
          reminder_date: reminderDate.toISOString(),
          status: 'scheduled'
        });
      }
      
      if (document.getElementById('reminder-customer').checked) {
        const daysBefore = parseInt(document.getElementById('customer-reminder-days').value) || 7;
        const reminderDate = new Date(dueDate);
        reminderDate.setDate(reminderDate.getDate() - daysBefore);
        
        orderReminders.push({
          id: Date.now() + Math.random() + 1,
          type: 'customer',
          days_before: daysBefore,
          reminder_date: reminderDate.toISOString(),
          status: 'scheduled'
        });
      }
    }
  }
  
  const orderDate = document.getElementById('order-date').value;
  const orderTime = document.getElementById('order-time').value;
  
  const order = {
    id: Date.now(),
    order_number: generateOrderNumber(),
    document_type: 'order',
    customer_id: customerId,
    customer_name: customer.name,
    customer_phone: customer.phone,
    items,
    subtotal,
    discount: discountAmount,
    tax: taxAmount,
    grand_total: grandTotal,
    created_at: orderDate,
    created_time: orderTime,
    delivery_date: document.getElementById('order-delivery-date').value || '',
    delivery_time: document.getElementById('order-delivery-time').value || '',
    notes: document.getElementById('order-notes').value || '',
    payment_status: paymentStatus,
    credit_info: creditInfo,
    due_date: dueDate ? dueDate.toISOString() : null,
    reminders: orderReminders,
    status: paymentStatus === 'fully_paid' ? 'completed' : 'pending',
    bill_generated: false,
    pdf_links: []
  };
  
  orders.push(order);
  
  // Add reminders to global reminders list
  orderReminders.forEach(reminder => {
    reminders.push({
      ...reminder,
      order_id: order.id,
      customer_name: customer.name,
      order_number: order.order_number,
      amount: grandTotal
    });
  });
  
  showToast('Order created successfully!');
  
  // Show WhatsApp send option
  setTimeout(() => {
    if (confirm('Order saved! Do you want to send WhatsApp message now?')) {
      sendWhatsAppMessage(order.id);
    }
  }, 500);
  
  clearOrderForm();
  updateDashboard();
});

function generateOrderNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const ordersThisMonth = orders.filter(o => {
    const orderDate = new Date(o.created_at);
    return orderDate.getFullYear() === year && orderDate.getMonth() === now.getMonth();
  }).length;
  
  const counter = String(ordersThisMonth + 1).padStart(3, '0');
  return `ORD-${year}-${month}-${counter}`;
}

function sendWhatsAppMessage(orderId) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  
  const customer = customers.find(c => c.id === order.customer_id);
  if (!customer) return;
  
  const message = generateWhatsAppMessage({
    customer_name: customer.name,
    order_id: order.order_number,
    document_type: order.document_type || 'order',
    order_date: new Date(order.created_at).toLocaleDateString('en-IN'),
    order_time: order.created_time || '',
    items: order.items,
    subtotal: `${CURRENCY}${order.subtotal.toFixed(2)}`,
    discount: `${CURRENCY}${order.discount.toFixed(2)}`,
    tax: `${CURRENCY}${order.tax.toFixed(2)}`,
    grand_total: `${CURRENCY}${order.grand_total.toFixed(2)}`,
    payment_status: order.payment_status,
    credit_info: order.credit_info,
    due_date: order.due_date,
    delivery_date: order.delivery_date || 'To be confirmed'
  });
  
  // Format phone number for WhatsApp (add country code)
  const phoneNumber = `91${customer.phone}`;
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
  
  // Log message
  messageLog.push({
    order_id: orderId,
    message_body: message,
    status: 'sent',
    timestamp: new Date().toISOString()
  });
  
  // Update customer WhatsApp status
  customer.whatsapp_status = 'WhatsApp Connected';
  
  // Open WhatsApp
  window.open(whatsappUrl, '_blank');
  
  showToast('Opening WhatsApp...');
  renderCustomers();
}

// Orders Management
function renderOrders() {
  filterOrders();
}

function filterOrders() {
  const statusFilter = document.getElementById('filter-status').value;
  const customerFilter = document.getElementById('filter-customer').value;
  const searchTerm = document.getElementById('search-order').value.toLowerCase();
  
  let filteredOrders = orders;
  
  if (statusFilter !== 'all') {
    filteredOrders = filteredOrders.filter(o => o.status === statusFilter);
  }
  
  if (customerFilter !== 'all') {
    filteredOrders = filteredOrders.filter(o => o.customer_id === parseInt(customerFilter));
  }
  
  if (searchTerm) {
    filteredOrders = filteredOrders.filter(o => 
      o.order_number.toLowerCase().includes(searchTerm) ||
      o.customer_name.toLowerCase().includes(searchTerm)
    );
  }
  
  const tbody = document.getElementById('orders-list');
  
  if (filteredOrders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No orders found</td></tr>';
    return;
  }
  
  tbody.innerHTML = filteredOrders.map(order => `
    <tr>
      <td><strong>${order.order_number}</strong></td>
      <td>${order.customer_name}</td>
      <td>${new Date(order.created_at).toLocaleDateString('en-IN')}</td>
      <td><strong>${CURRENCY}${order.grand_total.toFixed(2)}</strong></td>
      <td>
        <span class="status ${getStatusClass(order.status)}">${order.status}</span>
      </td>
      <td>
        <div class="action-buttons">
          <button class="btn btn--sm btn--secondary" onclick="viewOrderDetails(${order.id})">View</button>
          <button class="btn btn--sm btn--primary" onclick="sendWhatsAppMessage(${order.id})">WhatsApp</button>
          <button class="btn btn--sm btn--secondary" onclick="changeOrderStatus(${order.id})">Status</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function getStatusClass(status) {
  const statusMap = {
    'pending': 'status--warning',
    'completed': 'status--success',
    'shipped': 'status--info'
  };
  return statusMap[status] || 'status--info';
}

function viewOrderDetails(orderId) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  
  const itemsList = order.items.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${item.name}</td>
      <td>${item.quantity} ${item.unit}</td>
      <td>${CURRENCY}${item.price_per_unit.toFixed(2)}</td>
      <td><strong>${CURRENCY}${item.line_total.toFixed(2)}</strong></td>
    </tr>
  `).join('');
  
  const content = `
    <div style="margin-bottom: 24px;">
      <h4>Order ${order.order_number}</h4>
      <p style="color: var(--color-text-secondary); margin: 8px 0;">Date: ${new Date(order.created_at).toLocaleDateString('en-IN')}</p>
      <p style="margin: 8px 0;"><strong>Customer:</strong> ${order.customer_name} (+91 ${order.customer_phone})</p>
      <p style="margin: 8px 0;"><strong>Status:</strong> <span class="status ${getStatusClass(order.status)}">${order.status}</span></p>
      ${order.delivery_date ? `<p style="margin: 8px 0;"><strong>Delivery Date:</strong> ${order.delivery_date}</p>` : ''}
      ${order.notes ? `<p style="margin: 8px 0;"><strong>Notes:</strong> ${order.notes}</p>` : ''}
    </div>
    
    <h4 style="margin-bottom: 16px;">Order Items</h4>
    <table class="table" style="margin-bottom: 24px;">
      <thead>
        <tr>
          <th>#</th>
          <th>Item</th>
          <th>Quantity</th>
          <th>Price/Unit</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsList}
      </tbody>
    </table>
    
    <div style="background: var(--color-bg-3); padding: 16px; border-radius: 8px;">
      <div style="display: flex; justify-content: space-between; padding: 8px 0;">
        <span>Subtotal:</span>
        <span>${CURRENCY}${order.subtotal.toFixed(2)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 8px 0;">
        <span>Discount:</span>
        <span>${CURRENCY}${order.discount.toFixed(2)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 8px 0;">
        <span>Tax:</span>
        <span>${CURRENCY}${order.tax.toFixed(2)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 16px 0 0 0; border-top: 1px solid var(--color-border); font-size: 18px; font-weight: 600;">
        <span>Grand Total:</span>
        <span>${CURRENCY}${order.grand_total.toFixed(2)}</span>
      </div>
    </div>
    
    <div style="margin-top: 24px;">
      <button class="btn btn--primary" onclick="sendWhatsAppMessage(${order.id}); closeOrderDetailsModal();">Send WhatsApp</button>
      <button class="btn btn--secondary" onclick="downloadInvoice(${order.id})">Download Invoice</button>
    </div>
  `;
  
  document.getElementById('order-details-content').innerHTML = content;
  document.getElementById('order-details-modal').classList.add('show');
}

function closeOrderDetailsModal() {
  document.getElementById('order-details-modal').classList.remove('show');
}

function changeOrderStatus(orderId) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  
  const statuses = ['pending', 'completed', 'shipped'];
  const currentIndex = statuses.indexOf(order.status);
  const nextIndex = (currentIndex + 1) % statuses.length;
  
  order.status = statuses[nextIndex];
  renderOrders();
  updateDashboard();
  showToast(`Order status changed to ${order.status}`);
}

function downloadInvoice(orderId) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  
  // Generate simple text invoice
  const itemsList = order.items.map((item, index) => 
    `${index + 1}. ${item.name} - ${item.quantity} ${item.unit} × ${CURRENCY}${item.price_per_unit} = ${CURRENCY}${item.line_total.toFixed(2)}`
  ).join('\n');
  
  const invoice = `
========================================
           ${COMPANY_NAME}
              INVOICE
========================================

Order ID: ${order.order_number}
Date: ${new Date(order.created_at).toLocaleDateString('en-IN')}

Customer: ${order.customer_name}
Phone: +91 ${order.customer_phone}

========================================
ITEMS:
========================================

${itemsList}

========================================
SUMMARY:
========================================

Subtotal:     ${CURRENCY}${order.subtotal.toFixed(2)}
Discount:     ${CURRENCY}${order.discount.toFixed(2)}
Tax:          ${CURRENCY}${order.tax.toFixed(2)}
----------------------------------------
Grand Total:  ${CURRENCY}${order.grand_total.toFixed(2)}

========================================

Delivery Date: ${order.delivery_date || 'To be confirmed'}
Notes: ${order.notes || 'None'}

Thank you for your business!
`;
  
  // Create download
  const blob = new Blob([invoice], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `invoice-${order.order_number}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  
  showToast('Invoice downloaded');
}

// Dashboard
function updateDashboard() {
  // Calculate KPIs
  const fullyPaidOrders = orders.filter(o => o.payment_status === 'fully_paid');
  const creditOrders = orders.filter(o => o.payment_status === 'credit');
  
  const totalSales = fullyPaidOrders.reduce((sum, order) => sum + order.grand_total, 0);
  const totalReceivables = creditOrders.reduce((sum, order) => sum + order.grand_total, 0);
  
  const now = new Date();
  const overdueReceivables = creditOrders.filter(o => {
    if (!o.due_date) return false;
    return new Date(o.due_date) < now;
  }).reduce((sum, order) => sum + order.grand_total, 0);
  
  const totalCustomers = customers.length;
  
  document.getElementById('kpi-total-sales').textContent = `${CURRENCY}${totalSales.toFixed(2)}`;
  document.getElementById('kpi-total-receivables').textContent = `${CURRENCY}${totalReceivables.toFixed(2)}`;
  document.getElementById('kpi-overdue-receivables').textContent = `${CURRENCY}${overdueReceivables.toFixed(2)}`;
  document.getElementById('kpi-total-customers').textContent = totalCustomers;
  
  // Render recent orders
  const recentOrders = orders.slice(-5).reverse();
  const tbody = document.getElementById('recent-orders-list');
  
  if (recentOrders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No orders yet</td></tr>';
    return;
  }
  
  tbody.innerHTML = recentOrders.map(order => `
    <tr>
      <td><strong>${order.order_number}</strong></td>
      <td>${order.customer_name}</td>
      <td>${new Date(order.created_at).toLocaleDateString('en-IN')}</td>
      <td><strong>${CURRENCY}${order.grand_total.toFixed(2)}</strong></td>
      <td><span class="status ${getStatusClass(order.status)}">${order.status}</span></td>
    </tr>
  `).join('');
}

// Quotations
function openCreateQuotationModal() {
  // Reuse order creation logic but mark as quotation
  switchView('create-order');
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  document.querySelector('[data-view="create-order"]').classList.add('active');
  showToast('Creating quotation - save will create a quotation instead', 'info');
}

function renderQuotations() {
  const tbody = document.getElementById('quotations-list');
  
  if (quotations.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No quotations yet</td></tr>';
    return;
  }
  
  tbody.innerHTML = quotations.map(quote => {
    const status = quote.converted_to_order_id ? 'Converted' : 
                  new Date(quote.valid_until) < new Date() ? 'Expired' : 'Active';
    const statusClass = status === 'Converted' ? 'status--info' : 
                       status === 'Expired' ? 'status--error' : 'status--success';
    
    return `
      <tr>
        <td><strong>${quote.quotation_number}</strong></td>
        <td>${quote.customer_name}</td>
        <td>${new Date(quote.created_at).toLocaleDateString('en-IN')}</td>
        <td>${new Date(quote.valid_until).toLocaleDateString('en-IN')}</td>
        <td><strong>${CURRENCY}${quote.grand_total.toFixed(2)}</strong></td>
        <td><span class="status ${statusClass}">${status}</span></td>
        <td>
          <div class="action-buttons">
            <button class="btn btn--sm btn--secondary" onclick="viewOrderDetails(${quote.id}, true)">View</button>
            ${!quote.converted_to_order_id ? `<button class="btn btn--sm btn--primary" onclick="convertQuotationToOrder(${quote.id})">Convert</button>` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function convertQuotationToOrder(quotationId) {
  const quotation = quotations.find(q => q.id === quotationId);
  if (!quotation) return;
  
  if (!confirm('Convert this quotation to an order?')) return;
  
  const order = {
    id: Date.now(),
    order_number: generateOrderNumber(),
    document_type: 'order',
    customer_id: quotation.customer_id,
    customer_name: quotation.customer_name,
    customer_phone: quotation.customer_phone,
    items: quotation.items,
    subtotal: quotation.subtotal,
    discount: quotation.discount,
    tax: quotation.tax,
    grand_total: quotation.grand_total,
    created_at: new Date().toISOString().split('T')[0],
    created_time: new Date().toTimeString().slice(0, 5),
    delivery_date: '',
    delivery_time: '',
    notes: `Converted from quotation ${quotation.quotation_number}`,
    payment_status: 'fully_paid',
    credit_info: null,
    due_date: null,
    reminders: [],
    status: 'pending',
    bill_generated: false,
    pdf_links: []
  };
  
  orders.push(order);
  quotation.converted_to_order_id = order.id;
  
  showToast(`Quotation converted to order ${order.order_number}`);
  renderQuotations();
  updateDashboard();
}

// Reports
function renderReports() {
  filterReportByPeriod('monthly');
  renderReceivables();
}

function filterReportByPeriod(period) {
  const now = new Date();
  let startDate, endDate = now;
  
  switch(period) {
    case 'daily':
      startDate = new Date(now.setHours(0, 0, 0, 0));
      document.getElementById('report-period-label').textContent = 'Today';
      break;
    case 'weekly':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      document.getElementById('report-period-label').textContent = 'Last 7 Days';
      break;
    case 'monthly':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 30);
      document.getElementById('report-period-label').textContent = 'Last 30 Days';
      break;
    case 'yearly':
      startDate = new Date(now.getFullYear(), 0, 1);
      document.getElementById('report-period-label').textContent = 'This Year';
      break;
  }
  
  calculateReportMetrics(startDate, endDate);
}

function filterReportByCustomRange() {
  const startDate = new Date(document.getElementById('report-start-date').value);
  const endDate = new Date(document.getElementById('report-end-date').value);
  
  if (!startDate || !endDate) {
    showToast('Please select both start and end dates', 'error');
    return;
  }
  
  document.getElementById('report-period-label').textContent = 
    `${startDate.toLocaleDateString('en-IN')} - ${endDate.toLocaleDateString('en-IN')}`;
  
  calculateReportMetrics(startDate, endDate);
}

function calculateReportMetrics(startDate, endDate) {
  const filteredOrders = orders.filter(o => {
    const orderDate = new Date(o.created_at);
    return orderDate >= startDate && orderDate <= endDate;
  });
  
  const totalSales = filteredOrders.reduce((sum, o) => sum + o.grand_total, 0);
  const ordersCount = filteredOrders.length;
  const avgOrder = ordersCount > 0 ? totalSales / ordersCount : 0;
  
  document.getElementById('report-total-sales').textContent = `${CURRENCY}${totalSales.toFixed(2)}`;
  document.getElementById('report-orders-count').textContent = ordersCount;
  document.getElementById('report-avg-order').textContent = `${CURRENCY}${avgOrder.toFixed(2)}`;
}

function renderReceivables() {
  const tbody = document.getElementById('receivables-list');
  const creditOrders = orders.filter(o => o.payment_status === 'credit');
  
  if (creditOrders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No receivables</td></tr>';
    return;
  }
  
  const now = new Date();
  
  tbody.innerHTML = creditOrders.map(order => {
    const dueDate = new Date(order.due_date);
    const daysOverdue = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));
    
    let agingLabel = 'Not Due';
    let agingClass = 'status--success';
    
    if (daysOverdue > 60) {
      agingLabel = '60+ days';
      agingClass = 'status--error';
    } else if (daysOverdue > 30) {
      agingLabel = '31-60 days';
      agingClass = 'status--warning';
    } else if (daysOverdue > 7) {
      agingLabel = '8-30 days';
      agingClass = 'status--warning';
    } else if (daysOverdue >= 0) {
      agingLabel = '0-7 days';
      agingClass = 'status--info';
    }
    
    return `
      <tr>
        <td>${order.customer_name}</td>
        <td><strong>${order.order_number}</strong></td>
        <td><strong>${CURRENCY}${order.grand_total.toFixed(2)}</strong></td>
        <td>${dueDate.toLocaleDateString('en-IN')}</td>
        <td>${daysOverdue > 0 ? daysOverdue : 0} days</td>
        <td><span class="status ${agingClass}">${agingLabel}</span></td>
        <td>
          <button class="btn btn--sm btn--primary" onclick="sendPaymentReminder(${order.id})">Remind</button>
          <button class="btn btn--sm btn--secondary" onclick="markAsPaid(${order.id})">Mark Paid</button>
        </td>
      </tr>
    `;
  }).join('');
}

function sendPaymentReminder(orderId) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  
  const customer = customers.find(c => c.id === order.customer_id);
  if (!customer) return;
  
  const message = `Reminder: Your order ${order.order_number} (${CURRENCY}${order.grand_total.toFixed(2)}) payment is due on ${new Date(order.due_date).toLocaleDateString('en-IN')}. Please settle at your earliest convenience. Thank you!\n— ${COMPANY_NAME}`;
  
  const phoneNumber = `91${customer.phone}`;
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
  
  messageLog.push({
    order_id: orderId,
    message_body: message,
    type: 'reminder',
    status: 'sent',
    timestamp: new Date().toISOString()
  });
  
  window.open(whatsappUrl, '_blank');
  showToast('Opening WhatsApp reminder...');
}

function markAsPaid(orderId) {
  if (!confirm('Mark this order as fully paid?')) return;
  
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  
  order.payment_status = 'fully_paid';
  order.status = 'completed';
  
  showToast('Order marked as paid');
  renderReceivables();
  updateDashboard();
}

// Reminders
function renderReminders() {
  const tbody = document.getElementById('reminders-list');
  
  if (reminders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No scheduled reminders</td></tr>';
    return;
  }
  
  tbody.innerHTML = reminders.map(reminder => {
    const order = orders.find(o => o.id === reminder.order_id);
    if (!order) return '';
    
    return `
      <tr>
        <td>${reminder.customer_name}</td>
        <td><strong>${reminder.order_number}</strong></td>
        <td><strong>${CURRENCY}${reminder.amount.toFixed(2)}</strong></td>
        <td>${new Date(order.due_date).toLocaleDateString('en-IN')}</td>
        <td>${new Date(reminder.reminder_date).toLocaleDateString('en-IN')}</td>
        <td><span class="status status--info">${reminder.type === 'owner' ? 'Owner' : 'Customer'}</span></td>
        <td><span class="status ${reminder.status === 'sent' ? 'status--success' : 'status--warning'}">${reminder.status}</span></td>
        <td>
          ${reminder.status !== 'sent' ? `<button class="btn btn--sm btn--primary" onclick="sendReminderNow(${reminder.id})">Send Now</button>` : ''}
        </td>
      </tr>
    `;
  }).join('');
}

function sendReminderNow(reminderId) {
  const reminder = reminders.find(r => r.id === reminderId);
  if (!reminder) return;
  
  if (reminder.type === 'customer') {
    sendPaymentReminder(reminder.order_id);
  } else {
    showToast('Owner reminder: Check order ' + reminder.order_number, 'info');
  }
  
  reminder.status = 'sent';
  renderReminders();
}

// Initialize first order item
addOrderItem();