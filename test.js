const test = require('tape');
const React = require('react');
const {default: withProfunctorState} = require('./index');
const TestRenderer = require('react-test-renderer');

test('updates component state', t => {
  t.plan(6);
  const makeCallbag = () => {
    let talkback;
    let value;
    return function callbag(t, d) {
      if (t === 0 && value) (talkback = d)(1, value);
      else if (t === 0) talkback = d;
      else if (t === 1 && talkback) talkback(1, (value = d));
      else if (t === 1) value = d;
      else if (t === 2) (talkback = undefined), (value = undefined);
    };
  };

  const callbag = makeCallbag();

  class ProInput extends React.Component {
    componentDidMount() {
      callbag(0, (t, d) => {
        if (t === 1) this.props.setState(() => ({age: d}));
      });
    }

    componentWillUnmount() {
      callbag(2);
    }

    render() {
      return React.createElement(
        'span',
        null,
        `My age is ${this.props.state.age}`,
      );
    }
  }
  const Input = withProfunctorState(ProInput, {age: 20});

  const elem = React.createElement(Input);
  const testRenderer = TestRenderer.create(elem);

  const result1 = testRenderer.toJSON();
  t.ok(result1, 'should have rendered');
  t.equal(result1.children.length, 1, 'should have one child');
  t.equal(result1.children[0], 'My age is 20', 'should show 20');

  callbag(1, 30);
  testRenderer.update(elem);

  const result2 = testRenderer.toJSON();
  t.ok(result2, 'should have rendered');
  t.equal(result2.children.length, 1, 'should have one child');
  t.equal(result2.children[0], 'My age is 30', 'should show 30');

  testRenderer.unmount();
  t.end();
});

test('profunctor identity', t => {
  t.plan(6);
  const makeCallbag = () => {
    let talkback;
    let value;
    return function callbag(t, d) {
      if (t === 0 && value) (talkback = d)(1, value);
      else if (t === 0) talkback = d;
      else if (t === 1 && talkback) talkback(1, (value = d));
      else if (t === 1) value = d;
      else if (t === 2) (talkback = undefined), (value = undefined);
    };
  };

  const callbag = makeCallbag();
  class ProInput extends React.Component {
    componentDidMount() {
      callbag(0, (t, d) => {
        if (t === 1) this.props.setState(() => ({age: d}));
      });
    }
    componentWillUnmount() {
      callbag(2);
    }
    render() {
      const my = this.props.promap(x => x, x => x);
      return React.createElement('span', null, `My age is ${my.state.age}`);
    }
  }
  const Input = withProfunctorState(ProInput, {age: 20});

  const elem = React.createElement(Input);
  const testRenderer = TestRenderer.create(elem);

  const result1 = testRenderer.toJSON();
  t.ok(result1, 'should have rendered');
  t.equal(result1.children.length, 1, 'should have one child');
  t.equal(result1.children[0], 'My age is 20', 'should show 20');

  callbag(1, 30);
  testRenderer.update(elem);

  const result2 = testRenderer.toJSON();
  t.ok(result2, 'should have rendered');
  t.equal(result2.children.length, 1, 'should have one child');
  t.equal(result2.children[0], 'My age is 30', 'should show 30');

  testRenderer.unmount();
  t.end();
});

test('profunctor composition', t => {
  t.plan(8);
  const makeCallbag = () => {
    let talkback;
    let value;
    return function callbag(t, d) {
      if (t === 0 && value) (talkback = d)(1, value);
      else if (t === 0) talkback = d;
      else if (t === 1 && talkback) talkback(1, (value = d));
      else if (t === 1) value = d;
      else if (t === 2) (talkback = undefined), (value = undefined);
    };
  };

  const callbag = makeCallbag();

  const f = outer => outer.age;
  const g = age => age + 100;
  const h = age100 => age100 - 100;
  const i = age => ({age});

  class ProInput extends React.Component {
    constructor(props) {
      super(props);
      const level0 = props;
      const level1 = level0.promap(f, i);
      const level2 = level1.promap(g, h);
      this.state = {level0, level1, level2};
    }

    componentDidMount() {
      callbag(0, (t, d) => {
        if (t === 1) this.state.level2.setState(() => d);
      });
    }

    static getDerivedStateFromProps(props, state) {
      const level0 = props;
      const level1 = level0.promap(f, i);
      const level2 = level1.promap(g, h);
      return {level0, level1, level2};
    }

    componentWillUnmount() {
      callbag(2);
    }

    render() {
      t.equal(
        g(f(this.state.level0.state)),
        this.state.level2.state,
        'g . f compose',
      );
      return React.createElement(
        'span',
        null,
        `My age is ${this.state.level2.state}`,
      );
    }
  }
  const Input = withProfunctorState(ProInput, {age: 20});

  const elem = React.createElement(Input);
  const testRenderer = TestRenderer.create(elem);

  const result1 = testRenderer.toJSON();
  t.ok(result1, 'should have rendered');
  t.equal(result1.children.length, 1, 'should have one child');
  t.equal(result1.children[0], 'My age is 120', 'should show 120');

  callbag(1, 130);
  testRenderer.update(elem);

  const result2 = testRenderer.toJSON();
  t.ok(result2, 'should have rendered');
  t.equal(result2.children.length, 1, 'should have one child');
  t.equal(result2.children[0], 'My age is 130', 'should show 130');

  testRenderer.unmount();
  t.end();
});

test('profunctor composition', t => {
  t.plan(8);
  const makeCallbag = () => {
    let talkback;
    let value;
    return function callbag(t, d) {
      if (t === 0 && value) (talkback = d)(1, value);
      else if (t === 0) talkback = d;
      else if (t === 1 && talkback) talkback(1, (value = d));
      else if (t === 1) value = d;
      else if (t === 2) (talkback = undefined), (value = undefined);
    };
  };

  const callbag = makeCallbag();

  const f = outer => outer.age;
  const g = age => age + 100;
  const h = age100 => age100 - 100;
  const i = age => ({age});

  class ProInput extends React.Component {
    constructor(props) {
      super(props);
      const level0 = props;
      const level1 = level0.promap({get: f, set: i});
      const level2 = level1.promap({get: g, set: h});
      this.state = {level0, level1, level2};
    }

    componentDidMount() {
      callbag(0, (t, d) => {
        if (t === 1) this.state.level2.setState(() => d);
      });
    }

    static getDerivedStateFromProps(props, state) {
      const level0 = props;
      const level1 = level0.promap({get: f, set: i});
      const level2 = level1.promap({get: g, set: h});
      return {level0, level1, level2};
    }

    componentWillUnmount() {
      callbag(2);
    }

    render() {
      t.equal(
        g(f(this.state.level0.state)),
        this.state.level2.state,
        'g . f compose',
      );
      return React.createElement(
        'span',
        null,
        `My age is ${this.state.level2.state}`,
      );
    }
  }
  const Input = withProfunctorState(ProInput, {age: 20});

  const elem = React.createElement(Input);
  const testRenderer = TestRenderer.create(elem);

  const result1 = testRenderer.toJSON();
  t.ok(result1, 'should have rendered');
  t.equal(result1.children.length, 1, 'should have one child');
  t.equal(result1.children[0], 'My age is 120', 'should show 120');

  callbag(1, 130);
  testRenderer.update(elem);

  const result2 = testRenderer.toJSON();
  t.ok(result2, 'should have rendered');
  t.equal(result2.children.length, 1, 'should have one child');
  t.equal(result2.children[0], 'My age is 130', 'should show 130');

  testRenderer.unmount();
  t.end();
});
