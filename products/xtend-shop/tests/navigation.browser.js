void (async () => {
  const options = arguments[0] || {};
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
  const wait = async (condition, message) => {
    const deadline = Date.now() + 10000;
    while (!condition()) {if (Date.now() > deadline) throw new Error(message); await pause(20);}
  };
  const assert = (condition, message) => {if (!condition) throw new Error(message);};
  const originalAnimate = Element.prototype.animate;
  const originalFetch = window.fetch;
  let transitions = 0, noticeAnimations = 0, rejected = false;
  const finished = [];
  Element.prototype.animate = function (...args) {
    if (this.id === 'cart-feedback') noticeAnimations++;
    const result = originalAnimate.apply(this, args);
    if (this.id === 'store-main') {
      transitions++;
      finished.push(result.finished.catch(() => {}));
    }
    return result;
  };
  window.fetch = function (...args) {
    if (rejected && String(args[0]).includes('/shop.cart.add')) return Promise.resolve(new Response('{}', {status: 500, headers: {'Content-Type': 'application/json'}}));
    return originalFetch.apply(this, args);
  };
  try {
    await wait(() => window.XTendPage?.getRuntime(), 'Resume did not finish.');
    const client = window.XTendPage, model = () => client.getRuntime().model.snapshot().states;
    assert(matchMedia('(prefers-reduced-motion: reduce)').matches === !!options.reduced, 'Browser motion preference does not match the scenario.');
    const root = document.getElementById('xtend-page'), header = document.getElementById('store-header');
    const main = document.getElementById('store-main'), image = document.querySelector('.detail-image'), quantity = document.getElementById('quantity');
    assert(root.dataset.rmtResumeStatus === 'resumed', 'Expected signed resume without fallback.');
    const initialSku = model()['shop.data'].product.sku;
    const variantLinks = [...document.querySelectorAll('.variant-chip')];
    const alternate = variantLinks.find(link => !link.href.includes(initialSku));
    const nextSku = new URL(alternate.href).searchParams.get('sku');
    quantity.value = '3'; quantity.dispatchEvent(new Event('input', {bubbles: true}));
    await wait(() => String(model()['shop.quantity'].value) === '3', 'Quantity edit did not reach the kernel.');
    client.remember('variant-draft', {quantity: 3});
    window.scrollTo(0, 300); await pause(40);
    const beforeY = scrollY, oldImage = image.src;
    assert(beforeY > 0, 'Variant test must begin below the page top.');
    const thumbnail = [...document.querySelectorAll('.gallery-thumbnails a')].find(link => link.href === alternate.href);
    thumbnail.focus({preventScroll: true}); thumbnail.click();
    await wait(() => model()['shop.data'].product.sku === nextSku && location.search.includes(nextSku), 'Thumbnail did not update the URL and SKU.');
    await pause(100);
    const afterVariantY = scrollY;
    assert(Math.abs(scrollY - beforeY) <= 1, 'Thumbnail navigation reset scroll position.');
    assert(document.activeElement === thumbnail, 'Thumbnail navigation moved keyboard focus.');
    assert(document.querySelector('.detail-image') === image && image.src !== oldImage, 'Variant image was replaced rather than updated.');
    assert(document.getElementById('quantity') === quantity && quantity.value === '3', 'Variant navigation lost the quantity control or value.');
    assert(client.remember('variant-draft').quantity === 3, 'Variant navigation discarded remembered input.');
    assert(transitions === 0, 'A local variant change triggered a whole-page transition.');
    assert(document.querySelector('.variant-chip[aria-current=true]')?.href === alternate.href, 'Active variant marker is stale.');
    // Rapid color changes must settle on the latest click, with matching price and image.
    variantLinks.find(link => link.href.includes(initialSku)).click(); alternate.click();
    await wait(() => location.search.includes(nextSku) && model()['shop.data'].product.sku === nextSku, 'Latest color selection did not win.');
    await pause(250);
    assert(image.src.endsWith(model()['shop.data'].product.image), 'Image and final SKU disagree.');
    assert(document.querySelector('.product-detail .store-price').textContent.trim() === model()['shop.data'].product.priceText, 'Variant price is stale.');
    assert(Math.abs(scrollY - beforeY) <= 1, 'Color selection reset scroll position.');
    // Successful persisted actions produce feedback; they do not animate the whole page.
    document.getElementById('add-cart').click();
    await wait(() => model()['shop.data'].cart.count === 3 && !document.getElementById('cart-feedback').hidden, 'Persisted add did not produce feedback.');
    await pause(350);
    const notice = document.getElementById('cart-feedback');
    assert(notice.textContent.includes('hinzugefügt'), 'Add confirmation is absent.');
    const noticeBounds = notice.getBoundingClientRect(), noticeText = notice.querySelector('p');
    assert(noticeBounds.left >= 0 && noticeBounds.right <= innerWidth && noticeBounds.top >= 0 && noticeBounds.bottom <= innerHeight, 'Cart confirmation exceeds the viewport.');
    assert(noticeText.getBoundingClientRect().height <= 3 * parseFloat(getComputedStyle(noticeText).lineHeight) + 1, 'Cart confirmation wraps into an unreadable column.');
    assert(transitions === 0, 'Cart action triggered a page transition.');
    assert(options.reduced ? noticeAnimations === 0 : noticeAnimations > 0, 'Cart animation did not respect motion preferences.');
    const successAnimations = noticeAnimations;
    document.getElementById('dismiss-cart-feedback').click();
    await wait(() => notice.hidden, 'Confirmation cannot be dismissed.');
    rejected = true;
    document.getElementById('add-cart').click();
    await wait(() => model()['shop.actionStatus'].status === 'error', 'Deliberate server failure was not reported.');
    await pause(200); rejected = false;
    assert(model()['shop.data'].cart.count === 3 && noticeAnimations === successAnimations, 'Failed add produced a success animation or changed the cart.');
    assert(getComputedStyle(notice).display === 'none', 'Failed add left a visible success message.');
    await client.visit('/warenkorb'); await Promise.all(finished);
    assert(scrollY === 0, 'A normal page visit did not move to the page start.');
    assert(options.reduced ? transitions === 0 : transitions > 0, 'Page transition did not respect motion preferences.');
    assert(document.getElementById('store-main') === main && document.getElementById('store-header') === header && document.getElementById('xtend-page') === root, 'Navigation replaced persistent DOM roots.');
    document.querySelector('#store-main .remove-line').click();
    await wait(() => model()['shop.data'].cart.count === 0 && !notice.hidden, 'Persisted removal did not produce feedback.');
    await pause(350);
    assert(notice.textContent.includes('aktualisiert'), 'Removal confirmation is absent.');
    assert(document.getElementById('cart-count').textContent.trim() === '0', 'Persistent shell badge is stale.');
    await client.visit('/kategorie/technik'); await Promise.all(finished);
    assert(notice.hidden, 'Navigation retained an obsolete cart confirmation.');
    history.back();
    await wait(() => client.page.url.includes('/warenkorb'), 'Back navigation failed.');
    await Promise.all(finished);
    assert(document.documentElement.scrollWidth <= innerWidth, 'Navigation introduced horizontal overflow.');
    window.__STORE_TEST__ = {ok: true, status: 'passed', reduced: !!options.reduced, scrollBefore: beforeY, scrollAfterVariant: afterVariantY, transitions, noticeAnimations, retainedDom: true};
  } catch (error) {
    window.__STORE_TEST__ = {ok: false, status: 'failed', failure: error.message, transitions, noticeAnimations};
  } finally {
    Element.prototype.animate = originalAnimate;
    window.fetch = originalFetch;
  }
})();
