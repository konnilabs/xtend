'use strict';
const assert = require('node:assert/strict');

async function portableCapabilityChecks({ check, checkPhp, load, php }) {
  const portable = await load('rmt-portable-render.js');
  const { createRmtNodeSsrAdapter } = await load('rmt-node-ssr-adapter.js');
  const literal = value => ({ op: 'literal', value });
  const relational = { op: 'gt', left: literal(2), right: literal(1) };
  const descriptor = text => ({ type: 'text', text });
  const rejects = (run, target, pointer, op) => assert.throws(run, error =>
    error.diagnostics?.some(item => item.code === 'rmt.portable.operator_unsupported'
      && item.target === target && item.pointer === pointer && item.operator === op));

  await check('Node render capabilities reject Model-only operators and unknown nested expressions', () => {
    for (const target of ['node', 'php']) {
      rejects(() => portable.createPortableRenderArtifact({ descriptor: descriptor(relational) }, { target }), target, '/descriptor/text', 'gt');
      for (const alias of ['op', 'operator', 'kind', 'format']) {
        rejects(() => portable.createPortableRenderArtifact({ descriptor: descriptor({ [alias]: 'unknown', value: 7 }) }, { target }), target, '/descriptor/text', 'unknown');
      }
      rejects(() => portable.createPortableRenderArtifact({ descriptor: {
        type: 'component', component: 'x-status', slots: { details: [{ type: 'element', tag: 'span', text: { op: 'unknown' } }] }
      } }, { target }), target, '/descriptor/slots/details/0/text', 'unknown');
      rejects(() => portable.createPortableRenderArtifact({ descriptor: descriptor({ op: 'if', test: true, then: { op: 'unknown' }, else: '' }) }, { target }), target, '/descriptor/text/then', 'unknown');
      rejects(() => portable.createPortableRenderArtifact({ descriptor: descriptor({ op: 'filter', value: literal([1]), where: [{ op: 'concat', value: 1 }] }) }, { target }), target, '/descriptor/text/where/0', 'concat');
    }
  });
  await check('Node-only formatters execute while target advertisements retain the PHP boundary', async () => {
    for (const [expression, expected] of [
      [{ op: 'uppercase', value: 'abc' }, 'ABC'],
      [{ op: 'formatDateShort', value: '2026-11-07' }, '2026-11-07'],
      [{ op: 'replace', value: 'abc', search: 'a', replacement: 'x' }, 'xbc']
    ]) {
      const input = { descriptor: descriptor(expression) };
      assert.throws(() => portable.createPortableRenderArtifact(input, { target: 'php' }), /cannot execute/);
      const artifact = portable.createPortableRenderArtifact(input, { target: 'node' });
      assert.deepEqual(artifact.targets, ['node']);
      const projected = portable.projectPortableRender(artifact);
      assert.deepEqual(projected.descriptor.text, literal(expected));
      const result = await createRmtNodeSsrAdapter().render({ descriptor: projected.descriptor });
      assert(result.ok && result.html.includes(expected));
    }
  });
  await check('Node Model capabilities allow relational predicates but reject unknown state operators', () => {
    const input = { descriptor: descriptor('$model.filtered.length'), orchestrationArtifacts: { state: {
      states: [{ id: 'rows', type: 'array', initial: [{ score: 1 }, { score: 2 }] }],
      selectors: [{ id: 'filtered', from: 'state.rows', where: [{ op: 'truthy', left: { op: 'gt', left: '$item.score', right: literal(1) } }] }]
    } } };
    const artifact = portable.createPortableRenderArtifact(input, { target: 'node' });
    assert.deepEqual(portable.projectPortableRender(artifact).model.filtered, [{ score: 2 }]);
    assert.deepEqual(artifact.targets, ['node']);
    const bad = JSON.parse(JSON.stringify(input));
    bad.orchestrationArtifacts.state.selectors[0].where[0].left.op = 'unknown';
    rejects(() => portable.createPortableRenderArtifact(bad, { target: 'node' }), 'node', '/state/selectors/0/where/0/left', 'unknown');
    bad.orchestrationArtifacts.state.selectors[0].where[0] = { op: 'concat', left: literal(2), right: literal(2) };
    rejects(() => portable.createPortableRenderArtifact(bad, { target: 'node' }), 'node', '/state/selectors/0/where/0', 'concat');
  });
  await check('projection validates imported artifacts and cannot bypass capabilities through target labels', () => {
    const artifact = portable.createPortableRenderArtifact({ descriptor: descriptor('safe') });
    rejects(() => portable.projectPortableRender({ ...artifact, descriptor: descriptor(relational), targets: ['node'] }), 'node', '/descriptor/text', 'gt');
    assert.throws(() => portable.projectPortableRender({ ...artifact, targets: ['php'] }), /Node render target/);
    assert.throws(() => portable.createPortableRenderArtifact({ descriptor: descriptor('safe') }, { target: 'typo' }), /Unsupported.*target/);
    assert.throws(() => portable.createPortableRenderArtifact({ descriptor: descriptor('safe'), orchestrationArtifacts: { state: { selectors: [{ id: 'bad', transform: () => 'hidden' }] } } }, { target: 'node' }), /safe JSON/);
  });
  await check('validated node kind aliases are lowered before the Node renderer receives them', async () => {
    const artifact = portable.createPortableRenderArtifact({ descriptor: { kind: 'element', tag: 'p', text: 'Kind alias' } });
    const projected = portable.projectPortableRender(artifact);
    assert.equal(projected.descriptor.type, 'element');
    const node = await createRmtNodeSsrAdapter().render({ descriptor: projected.descriptor });
    assert(node.ok && node.html.includes('<p>Kind alias</p>'));
  });
  await checkPhp('rule operators execute in Node and PHP while literals and property names remain data', async () => {
    const artifact = portable.createPortableRenderArtifact({ descriptor: {
      type: 'element', tag: 'p', attributes: { op: 'literal attribute name' },
      classes: { op: true, format: false },
      properties: { details: literal({ op: 'replace', value: 'literal data', search: '[' }) },
      text: { op: 'reduce', value: { op: 'filter', value: literal([{ score: 1 }, { score: 2 }]), where: [{ op: 'gt', path: 'score', value: 1 }] } }
    } });
    const projected = portable.projectPortableRender(artifact);
    assert.equal(projected.descriptor.text.value, '1');
    assert.deepEqual(projected.descriptor.properties.details.value, { op: 'replace', value: 'literal data', search: '[' });
    assert.equal(projected.descriptor.attributes.class.value, 'op');
    const node = await createRmtNodeSsrAdapter().render({ descriptor: projected.descriptor });
    const result = php({ artifact, props: {} });
    assert(node.ok && result.result.ok);
    assert.equal(node.html, result.result.html);
    assert.match(node.html, /op="literal attribute name"/);
    const alias = portable.createPortableRenderArtifact({ descriptor: { kind: 'element', tag: 'p', text: 'Kind alias' } });
    const aliasNode = await createRmtNodeSsrAdapter().render({ descriptor: portable.projectPortableRender(alias).descriptor });
    assert.equal(aliasNode.html, php({ artifact: alias, props: {} }).result.html);
  });
}

module.exports = { portableCapabilityChecks };
