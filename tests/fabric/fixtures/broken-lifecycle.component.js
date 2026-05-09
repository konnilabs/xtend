const BROKEN_LIFECYCLE_FIXTURE_CONTRACT = 'xtend.fabric.lifecycle-error-boundary.fixture.v1';

class BrokenLifecycleComponent {
  connectedCallback() {
    throw new Error('connected lifecycle failure');
  }

  attributeChangedCallback() {
    throw new Error('attribute lifecycle failure');
  }

  render() {
    throw new Error('render lifecycle failure');
  }

  hydrate() {
    return Promise.reject(new Error('hydrate lifecycle failure'));
  }

  disconnectedCallback() {
    throw new Error('disconnect lifecycle failure');
  }

  handleClick() {
    throw new Error('event handler failure');
  }
}

module.exports = {
  BROKEN_LIFECYCLE_FIXTURE_CONTRACT,
  BrokenLifecycleComponent
};
