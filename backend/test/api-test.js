import { InMemoryDomainRepository } from '../src/repositories/inMemoryDomainRepository.js';
import { RegistrarClient } from '../src/services/registrarClient.js';
import { DomainService } from '../src/services/domainService.js';
import { CheckoutService } from '../src/services/checkoutService.js';

async function runTests() {
  console.log('--- STARTING BACKEND INTEGRATION & DOMAIN LIFECYCLE TESTS ---');

  const repo = new InMemoryDomainRepository();
  const registrar = new RegistrarClient({ latencyMs: 50 }); // Fast for tests
  const domainService = new DomainService(repo);
  const checkoutService = new CheckoutService(repo, registrar);

  // Test 1: Search for an unbought domain "nexustech"
  console.log('\n[TEST 1] Searching for "nexustech"...');
  const search1 = await domainService.search('nexustech');
  if (!search1.results || search1.results.length === 0) {
    throw new Error('Search returned no results');
  }
  const comDomain = search1.results.find((r) => r.tld === '.com');
  const inDomain = search1.results.find((r) => r.tld === '.in');

  if (!comDomain || !comDomain.available) {
    throw new Error('Expected nexustech.com to be available');
  }
  if (!inDomain || !inDomain.available) {
    throw new Error('Expected nexustech.in to be available');
  }
  console.log('✓ Available check passed: nexustech.com & nexustech.in are available');

  // Test 2: Reserve "nexustech.com"
  console.log('\n[TEST 2] Reserving "nexustech.com"...');
  const reservation = await checkoutService.reserveDomain({
    domainName: 'nexustech.com',
    customerEmail: 'alex@example.com',
    years: 1
  });
  if (!reservation.reservationId || reservation.domainName !== 'nexustech.com') {
    throw new Error('Reservation failed');
  }
  console.log(`✓ Reservation successful. ID: ${reservation.reservationId}`);

  // Test 3: Purchase "nexustech.com"
  console.log('\n[TEST 3] Processing purchase & registrar registration for "nexustech.com"...');
  const purchaseResult = await checkoutService.processPurchase({
    reservationId: reservation.reservationId,
    domainName: 'nexustech.com',
    years: 2,
    customer: {
      name: 'Alex Rivera',
      email: 'alex@example.com',
      phone: '+1-555-0199',
      country: 'US'
    },
    paymentDetails: {
      method: 'Credit Card',
      cardNumber: '4111 2222 3333 4444',
      expiry: '12/28',
      cvv: '123'
    }
  });

  if (!purchaseResult.success) {
    throw new Error('Purchase failed');
  }
  if (purchaseResult.domain.domainName !== 'nexustech.com') {
    throw new Error('Domain name mismatch');
  }
  if (!purchaseResult.registrar.transactionId) {
    throw new Error('External registrar transaction ID missing');
  }
  if (purchaseResult.owner.email !== 'alex@example.com') {
    throw new Error('Ownership not assigned to customer');
  }
  console.log(`✓ Purchase & Registrar registration complete! Order: ${purchaseResult.orderId}`);
  console.log(`  Registrar ref: ${purchaseResult.registrar.transactionId}`);
  console.log(`  Owner: ${purchaseResult.owner.name} (${purchaseResult.owner.email})`);

  // Test 4: Search again - "nexustech.com" must now be TAKEN, but "nexustech.in" must remain AVAILABLE
  console.log('\n[TEST 4] Re-searching "nexustech"...');
  const search2 = await domainService.search('nexustech');
  const comDomainAfter = search2.results.find((r) => r.tld === '.com');
  const inDomainAfter = search2.results.find((r) => r.tld === '.in');

  if (comDomainAfter.available || comDomainAfter.status !== 'TAKEN') {
    throw new Error('Expected nexustech.com to be TAKEN after purchase');
  }
  if (!inDomainAfter.available || inDomainAfter.status !== 'AVAILABLE') {
    throw new Error('Expected nexustech.in to remain AVAILABLE');
  }
  console.log('✓ Availability state verified: nexustech.com is TAKEN, nexustech.in is AVAILABLE');

  // Test 5: Verify customer domains
  console.log('\n[TEST 5] Checking customer domains for alex@example.com...');
  const customerDomains = await checkoutService.getDomainsByCustomer('alex@example.com');
  if (customerDomains.length !== 1 || customerDomains[0].domainName !== 'nexustech.com') {
    throw new Error('Customer domains lookup failed');
  }
  console.log(`✓ Customer ownership verified: ${customerDomains[0].domainName} is assigned to customer`);

  // Test 6: Verify double purchase prevention
  console.log('\n[TEST 6] Attempting duplicate purchase on "nexustech.com"...');
  let caughtError = false;
  try {
    await checkoutService.processPurchase({
      domainName: 'nexustech.com',
      customer: { name: 'Intruder', email: 'other@example.com' },
      paymentDetails: {}
    });
  } catch (err) {
    caughtError = true;
    console.log(`✓ Correctly rejected duplicate purchase: "${err.message}"`);
  }
  if (!caughtError) {
    throw new Error('Failed to prevent duplicate purchase');
  }

  console.log('\n🎉 ALL 6 BACKEND INTEGRATION TESTS PASSED SUCCESSFULLY!');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
