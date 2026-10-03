void (async () => {
  const options = arguments[0];
  const deadline = Date.now() + 15000;
  const wait = async (condition, message = 'Drawer did not become ready.') => {
    while (!condition()) {
      if (Date.now() > deadline) throw new Error(message);
      await new Promise(resolve => setTimeout(resolve, 25));
    }
  };
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const originalFetch = window.fetch;
  let mutations = 0;
  window.fetch = function (...args) {
    if (String(args[0]).includes('/shop.cart.set')) mutations += 1;
    return originalFetch.apply(this, args);
  };
  try {
    await wait(() => window.XTendPage?.getRuntime());
    if (options.populated) {
      document.getElementById('add-cart').click();
      await wait(() => window.XTendPage.getRuntime().model.snapshot().states['shop.data'].cart.count === 1);
    }
    const trigger = document.getElementById(options.trigger);
    trigger.focus(); trigger.click();
    await wait(() => document.getElementById(options.id)?.open);
    const host = document.getElementById(options.id);
    const panel = host.shadowRoot.querySelector('.drawer');
    await wait(() => getComputedStyle(panel).opacity === '1');
    const style = getComputedStyle(panel);
    const color = value => value.match(/[\d.]+/g)?.map(Number) || [];
    const background = color(style.backgroundColor);
    assert(background.length === 3 || background[3] === 1, 'Drawer surface is transparent.');
    const luminance = channels => channels.slice(0, 3).map(value => value / 255)
      .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
      .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
    const contrasts = [panel, host.querySelector('p')].filter(Boolean).map(element => {
      const values = [luminance(background), luminance(color(getComputedStyle(element).color))].sort((a, b) => b - a);
      return (values[0] + 0.05) / (values[1] + 0.05);
    });
    assert(contrasts.every(value => value >= 4.5), 'Drawer text contrast is insufficient.');
    assert(getComputedStyle(host).getPropertyValue('--xtend-surface').trim() !== host.dataset.rmtSurface, 'Surface identity overwrote a theme color.');
    const bounds = panel.getBoundingClientRect();
    assert(bounds.left >= -1 && bounds.right <= innerWidth + 1 && bounds.bottom <= innerHeight + 1, 'Drawer exceeds the viewport.');
    assert(Number(style.zIndex) > Number(getComputedStyle(host.shadowRoot.querySelector('.overlay')).zIndex), 'Backdrop covers the drawer.');
    if (options.populated) {
      assert(host.querySelector('.mini-cart-line')?.textContent.includes('NOVA'), 'Persisted cart line is missing.');
      const quantity = host.querySelector('input[name="quantity"]');
      assert(quantity?.getBoundingClientRect().height >= 44, 'Resumed quantity control is missing or too small.');
      quantity.value = '2';
      quantity.form.requestSubmit();
      await wait(() => window.XTendPage.getRuntime().model.snapshot().states['shop.data'].cart.count === 2, 'Quantity update did not reach Laravel and the cart state.');
      assert(host.querySelector('input[name="quantity"]')?.value === '2', 'Persisted quantity did not reach the drawer.');
    }
    host.shadowRoot.querySelector('.close').click();
    const state = options.id === 'mini-cart' ? 'shop.miniCart' : 'shop.filterDrawer';
    await wait(() => !host.open && window.XTendPage.getRuntime().model.snapshot().states[state].open === false, 'Drawer close did not settle in the kernel.');
    assert(document.activeElement === trigger, 'Closing the drawer did not return focus.');
    trigger.click();
    await wait(() => host.open && getComputedStyle(panel).opacity === '1');
    if (options.populated) assert(mutations === 1, 'Quantity change executed more than one mutation.');
    window.__STORE_TEST__ = {ok: true, status: 'passed', mutations, background: style.backgroundColor, contrasts, width: bounds.width, height: bounds.height};
  } catch (error) {
    window.__STORE_TEST__ = {ok: false, status: 'failed', failure: error.message};
  } finally {
    window.fetch = originalFetch;
  }
})();
