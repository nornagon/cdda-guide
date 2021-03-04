
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.34.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const typeMappings = new Map([
        ["AMMO", "item"],
        ["GUN", "item"],
        ["ARMOR", "item"],
        ["PET_ARMOR", "item"],
        ["TOOL", "item"],
        ["TOOLMOD", "item"],
        ["TOOL_ARMOR", "item"],
        ["BOOK", "item"],
        ["COMESTIBLE", "item"],
        ["ENGINE", "item"],
        ["WHEEL", "item"],
        ["GUNMOD", "item"],
        ["MAGAZINE", "item"],
        ["BATTERY", "item"],
        ["GENERIC", "item"],
        ["BIONIC_ITEM", "item"],
        ["MONSTER", "monster"],
    ]);
    const mapType = (type) => { var _a; return (_a = typeMappings.get(type)) !== null && _a !== void 0 ? _a : type; };
    const singularName = (obj) => {
        var _a, _b;
        return (obj === null || obj === void 0 ? void 0 : obj.name)
            ? typeof obj.name === 'string'
                ? obj.name
                : (_a = obj.name.str_sp) !== null && _a !== void 0 ? _a : obj.name.str
            : /* fallback to id? */ (_b = obj === null || obj === void 0 ? void 0 : obj.id) !== null && _b !== void 0 ? _b : obj === null || obj === void 0 ? void 0 : obj.abstract;
    };
    const pluralName = (obj) => {
        var _a, _b, _c;
        return (obj === null || obj === void 0 ? void 0 : obj.name)
            ? typeof obj.name === 'string'
                ? obj.name
                : (_b = (_a = obj.name.str_sp) !== null && _a !== void 0 ? _a : obj.name.str_pl) !== null && _b !== void 0 ? _b : obj.name.str + 's'
            : /* fallback to id? */ (_c = obj === null || obj === void 0 ? void 0 : obj.id) !== null && _c !== void 0 ? _c : obj === null || obj === void 0 ? void 0 : obj.abstract;
    };
    class CddaData {
        constructor(raw) {
            this._byType = new Map;
            this._byTypeById = new Map;
            this._abstractsByType = new Map;
            this._toolReplacements = new Map;
            this._craftingPseudoItems = new Map;
            this._raw = raw;
            for (const obj of raw) {
                if (!Object.hasOwnProperty.call(obj, 'type'))
                    continue;
                const mappedType = mapType(obj.type);
                if (!this._byType.has(mappedType))
                    this._byType.set(mappedType, []);
                this._byType.get(mappedType).push(obj);
                if (Object.hasOwnProperty.call(obj, 'id')) {
                    if (!this._byTypeById.has(mappedType))
                        this._byTypeById.set(mappedType, new Map);
                    this._byTypeById.get(mappedType).set(obj.id, obj);
                }
                if (Object.hasOwnProperty.call(obj, 'abstract')) {
                    if (!this._abstractsByType.has(mappedType))
                        this._abstractsByType.set(mappedType, new Map);
                    this._abstractsByType.get(mappedType).set(obj.abstract, obj);
                }
                if (obj.type === 'TOOL' && Object.hasOwnProperty.call(obj, 'sub')) {
                    if (!this._toolReplacements.has(obj.sub))
                        this._toolReplacements.set(obj.sub, []);
                    this._toolReplacements.get(obj.sub).push(obj.id);
                }
                if (Object.hasOwnProperty.call(obj, 'crafting_pseudo_item')) {
                    this._craftingPseudoItems.set(obj.crafting_pseudo_item, obj.id);
                }
            }
        }
        byId(type, id) {
            var _a;
            if (!id)
                throw new Error('fix');
            const obj = (_a = this._byTypeById.get(type)) === null || _a === void 0 ? void 0 : _a.get(id);
            if (obj)
                return this._flatten(obj);
        }
        byType(type) {
            // TODO: flatten...?
            return this._byType.get(type);
        }
        replacementTools(type) {
            var _a;
            return (_a = this._toolReplacements.get(type)) !== null && _a !== void 0 ? _a : [];
        }
        craftingPseudoItem(id) {
            return this._craftingPseudoItems.get(id);
        }
        all() {
            return this._raw;
        }
        _flatten(obj) {
            var _a, _b, _c, _d, _e, _f;
            const parent = 'copy-from' in obj
                ? (_b = (_a = this._byTypeById.get(mapType(obj.type))) === null || _a === void 0 ? void 0 : _a.get(obj['copy-from'])) !== null && _b !== void 0 ? _b : (_c = this._abstractsByType.get(mapType(obj.type))) === null || _c === void 0 ? void 0 : _c.get(obj['copy-from']) : null;
            if ('copy-from' in obj && !parent)
                console.error(`Missing parent in ${(_d = obj.id) !== null && _d !== void 0 ? _d : obj.abstract}`);
            if (!parent)
                return obj;
            const ret = Object.assign(Object.assign({}, this._flatten(parent)), obj);
            for (const k of Object.keys((_e = ret.relative) !== null && _e !== void 0 ? _e : {})) {
                if (typeof ret.relative[k] === 'number') {
                    ret[k] += ret.relative[k];
                }
                // TODO: damage, vitamins, mass, volume, time
            }
            delete ret.relative;
            for (const k of Object.keys((_f = ret.proportional) !== null && _f !== void 0 ? _f : {})) {
                if (typeof ret.proportional[k] === 'number') {
                    if (k === 'attack_cost' && !(k in ret))
                        ret[k] = 100;
                    ret[k] *= ret.proportional[k];
                    ret[k] = ret[k] | 0; // most things are ints.. TODO: what keys are float?
                }
                // TODO: damage, mass, volume, time (need to check the base value's type)
            }
            delete ret.proportional;
            return ret;
        }
    }
    const json = (async () => {
        const latestBuildRes = await fetch(`https://raw.githubusercontent.com/nornagon/cdda-data/main/latest-build.json`);
        if (!latestBuildRes.ok)
            throw new Error(`Error ${latestBuildRes.status} (${latestBuildRes.statusText}) fetching data`);
        const { latest_build } = await latestBuildRes.json();
        const res = await fetch(`https://raw.githubusercontent.com/nornagon/cdda-data/main/data/${latest_build}/all.json`);
        if (!res.ok)
            throw new Error(`Error ${res.status} (${res.statusText}) fetching data`);
        const json = await res.json();
        return new CddaData(json);
    })();
    const data = readable(null, function (set) {
        json.then(set);
    });

    /* src/types/Monster.svelte generated by Svelte v3.34.0 */
    const file$6 = "src/types/Monster.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	child_ctx[7] = i;
    	return child_ctx;
    }

    function get_each_context_1$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	child_ctx[7] = i;
    	return child_ctx;
    }

    function get_each_context_2$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	return child_ctx;
    }

    // (205:34) {#each materials as m}
    function create_each_block_2$2(ctx) {
    	let li;
    	let a;
    	let t_value = /*m*/ ctx[10].name + "";
    	let t;

    	const block = {
    		c: function create() {
    			li = element("li");
    			a = element("a");
    			t = text(t_value);
    			attr_dev(a, "href", "#/material/" + /*m*/ ctx[10].id);
    			add_location(a, file$6, 204, 60, 10935);
    			add_location(li, file$6, 204, 56, 10931);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, a);
    			append_dev(a, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2$2.name,
    		type: "each",
    		source: "(205:34) {#each materials as m}",
    		ctx
    	});

    	return block;
    }

    // (216:4) {#if item.special_attacks}
    function create_if_block_3$2(ctx) {
    	let dt;
    	let dd;
    	let ul;
    	let each_value_1 = /*item*/ ctx[0].special_attacks;
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$3(get_each_context_1$3(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			dt = element("dt");
    			dt.textContent = "Special attacks:";
    			dd = element("dd");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(dt, file$6, 216, 4, 11319);
    			attr_dev(ul, "class", "no-bullets");
    			add_location(ul, file$6, 217, 6, 11355);
    			add_location(dd, file$6, 216, 29, 11344);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, dt, anchor);
    			insert_dev(target, dd, anchor);
    			append_dev(dd, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*specialAttackToString, item*/ 1) {
    				each_value_1 = /*item*/ ctx[0].special_attacks;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$3(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(dt);
    			if (detaching) detach_dev(dd);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$2.name,
    		type: "if",
    		source: "(216:4) {#if item.special_attacks}",
    		ctx
    	});

    	return block;
    }

    // (219:6) {#each item.special_attacks as special_attack, i}
    function create_each_block_1$3(ctx) {
    	let li;
    	let t_value = specialAttackToString(/*special_attack*/ ctx[8]) + "";
    	let t;

    	const block = {
    		c: function create() {
    			li = element("li");
    			t = text(t_value);
    			add_location(li, file$6, 219, 8, 11443);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*item*/ 1 && t_value !== (t_value = specialAttackToString(/*special_attack*/ ctx[8]) + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$3.name,
    		type: "each",
    		source: "(219:6) {#each item.special_attacks as special_attack, i}",
    		ctx
    	});

    	return block;
    }

    // (249:4) {#if item.anger_triggers}
    function create_if_block_2$2(ctx) {
    	let dt;
    	let dd;
    	let t1_value = /*item*/ ctx[0].anger_triggers.join(", ") + "";
    	let t1;

    	const block = {
    		c: function create() {
    			dt = element("dt");
    			dt.textContent = "Anger triggers";
    			dd = element("dd");
    			t1 = text(t1_value);
    			add_location(dt, file$6, 249, 4, 12356);
    			add_location(dd, file$6, 249, 27, 12379);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, dt, anchor);
    			insert_dev(target, dd, anchor);
    			append_dev(dd, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*item*/ 1 && t1_value !== (t1_value = /*item*/ ctx[0].anger_triggers.join(", ") + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(dt);
    			if (detaching) detach_dev(dd);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$2.name,
    		type: "if",
    		source: "(249:4) {#if item.anger_triggers}",
    		ctx
    	});

    	return block;
    }

    // (252:4) {#if item.placate_triggers}
    function create_if_block_1$4(ctx) {
    	let dt;
    	let dd;
    	let t1_value = /*item*/ ctx[0].placate_triggers.join(", ") + "";
    	let t1;

    	const block = {
    		c: function create() {
    			dt = element("dt");
    			dt.textContent = "Placate triggers";
    			dd = element("dd");
    			t1 = text(t1_value);
    			add_location(dt, file$6, 252, 4, 12467);
    			add_location(dd, file$6, 252, 29, 12492);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, dt, anchor);
    			insert_dev(target, dd, anchor);
    			append_dev(dd, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*item*/ 1 && t1_value !== (t1_value = /*item*/ ctx[0].placate_triggers.join(", ") + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(dt);
    			if (detaching) detach_dev(dd);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$4.name,
    		type: "if",
    		source: "(252:4) {#if item.placate_triggers}",
    		ctx
    	});

    	return block;
    }

    // (255:112) {#if i < item.flags.length - 1}
    function create_if_block$5(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(", ");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(255:112) {#if i < item.flags.length - 1}",
    		ctx
    	});

    	return block;
    }

    // (255:22) {#each item.flags ?? [] as flag, i}
    function create_each_block$3(ctx) {
    	let abbr;
    	let t_value = /*flag*/ ctx[5] + "";
    	let t;
    	let abbr_title_value;
    	let if_block_anchor;
    	let if_block = /*i*/ ctx[7] < /*item*/ ctx[0].flags.length - 1 && create_if_block$5(ctx);

    	const block = {
    		c: function create() {
    			abbr = element("abbr");
    			t = text(t_value);
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr_dev(abbr, "title", abbr_title_value = /*mon_flag_descriptions*/ ctx[1][/*flag*/ ctx[5]]);
    			add_location(abbr, file$6, 254, 57, 12603);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, abbr, anchor);
    			append_dev(abbr, t);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*item*/ 1 && t_value !== (t_value = /*flag*/ ctx[5] + "")) set_data_dev(t, t_value);

    			if (dirty & /*item*/ 1 && abbr_title_value !== (abbr_title_value = /*mon_flag_descriptions*/ ctx[1][/*flag*/ ctx[5]])) {
    				attr_dev(abbr, "title", abbr_title_value);
    			}

    			if (/*i*/ ctx[7] < /*item*/ ctx[0].flags.length - 1) {
    				if (if_block) ; else {
    					if_block = create_if_block$5(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(abbr);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(255:22) {#each item.flags ?? [] as flag, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let h10;
    	let span0;
    	let t0_value = /*item*/ ctx[0].symbol + "";
    	let t0;
    	let span0_class_value;
    	let t1;
    	let t2_value = singularName(/*item*/ ctx[0]) + "";
    	let t2;
    	let t3;
    	let section0;
    	let p0;
    	let t4_value = /*item*/ ctx[0].description + "";
    	let t4;
    	let t5;
    	let p1;
    	let t6;
    	let t7_value = difficulty(/*item*/ ctx[0]) + "";
    	let t7;
    	let t8;
    	let span1;
    	let t9;
    	let t10_value = difficultyDescription(difficulty(/*item*/ ctx[0])) + "";
    	let t10;
    	let t11;
    	let span1_class_value;
    	let t12;
    	let section1;
    	let h11;
    	let t14;
    	let dl0;
    	let dt0;
    	let dd0;
    	let t16_value = /*item*/ ctx[0].bodytype + "";
    	let t16;
    	let dt1;
    	let dd1;
    	let t18_value = (/*item*/ ctx[0].species ?? []).join(", ") + "";
    	let t18;
    	let dt2;
    	let dd2;
    	let t20_value = /*item*/ ctx[0].volume + "";
    	let t20;
    	let dt3;
    	let dd3;
    	let t22_value = /*item*/ ctx[0].weight + "";
    	let t22;
    	let dt4;
    	let dd4;
    	let ul;
    	let t24;
    	let section2;
    	let h12;
    	let t26;
    	let div;
    	let dl1;
    	let dt5;
    	let dd5;
    	let t28_value = /*item*/ ctx[0].speed + "";
    	let t28;
    	let dt6;
    	let dd6;
    	let t30_value = (/*item*/ ctx[0].melee_skill ?? 0) + "";
    	let t30;
    	let dt7;
    	let dd7;
    	let t32_value = damage(/*item*/ ctx[0]) + "";
    	let t32;
    	let t33;
    	let dl3;
    	let dt8;
    	let dd8;
    	let t35_value = /*item*/ ctx[0].hp + "";
    	let t35;
    	let dt9;
    	let dd9;
    	let t37_value = (/*item*/ ctx[0].dodge ?? 0) + "";
    	let t37;
    	let dt10;
    	let dd16;
    	let dl2;
    	let dt11;
    	let dd10;
    	let t40_value = (/*item*/ ctx[0].armor_bash ?? 0) + "";
    	let t40;
    	let dt12;
    	let dd11;
    	let t42_value = (/*item*/ ctx[0].armor_cut ?? 0) + "";
    	let t42;
    	let dt13;
    	let dd12;
    	let t44_value = (/*item*/ ctx[0].armor_stab ?? Math.floor((/*item*/ ctx[0].armor_cut ?? 0) * 0.8)) + "";
    	let t44;
    	let dt14;
    	let dd13;
    	let t46_value = (/*item*/ ctx[0].armor_bullet ?? 0) + "";
    	let t46;
    	let dt15;
    	let dd14;
    	let t48_value = (/*item*/ ctx[0].armor_acid ?? Math.floor((/*item*/ ctx[0].armor_cut ?? 0) * 0.5)) + "";
    	let t48;
    	let dt16;
    	let dd15;
    	let t50_value = (/*item*/ ctx[0].armor_fire ?? 0) + "";
    	let t50;
    	let t51;
    	let section3;
    	let h13;
    	let t53;
    	let dl4;
    	let dt17;
    	let dd17;
    	let t55_value = /*item*/ ctx[0].aggression + "";
    	let t55;
    	let dt18;
    	let dd18;
    	let t57_value = /*item*/ ctx[0].morale + "";
    	let t57;
    	let dt19;
    	let dd19;
    	let t59_value = /*item*/ ctx[0].default_faction + "";
    	let t59;
    	let if_block1_anchor;
    	let dt20;
    	let dd20;
    	let dt21;
    	let dd21;
    	let t62_value = (/*item*/ ctx[0].death_function ?? []).join(", ") + "";
    	let t62;
    	let each_value_2 = /*materials*/ ctx[2];
    	validate_each_argument(each_value_2);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_1[i] = create_each_block_2$2(get_each_context_2$2(ctx, each_value_2, i));
    	}

    	let if_block0 = /*item*/ ctx[0].special_attacks && create_if_block_3$2(ctx);
    	let if_block1 = /*item*/ ctx[0].anger_triggers && create_if_block_2$2(ctx);
    	let if_block2 = /*item*/ ctx[0].placate_triggers && create_if_block_1$4(ctx);
    	let each_value = /*item*/ ctx[0].flags ?? [];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			h10 = element("h1");
    			span0 = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			t2 = text(t2_value);
    			t3 = space();
    			section0 = element("section");
    			p0 = element("p");
    			t4 = text(t4_value);
    			t5 = space();
    			p1 = element("p");
    			t6 = text("Difficulty: ");
    			t7 = text(t7_value);
    			t8 = space();
    			span1 = element("span");
    			t9 = text("(");
    			t10 = text(t10_value);
    			t11 = text(")");
    			t12 = space();
    			section1 = element("section");
    			h11 = element("h1");
    			h11.textContent = "Body";
    			t14 = space();
    			dl0 = element("dl");
    			dt0 = element("dt");
    			dt0.textContent = "Body type";
    			dd0 = element("dd");
    			t16 = text(t16_value);
    			dt1 = element("dt");
    			dt1.textContent = "Species";
    			dd1 = element("dd");
    			t18 = text(t18_value);
    			dt2 = element("dt");
    			dt2.textContent = "Volume";
    			dd2 = element("dd");
    			t20 = text(t20_value);
    			dt3 = element("dt");
    			dt3.textContent = "Weight";
    			dd3 = element("dd");
    			t22 = text(t22_value);
    			dt4 = element("dt");
    			dt4.textContent = "Material";
    			dd4 = element("dd");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t24 = space();
    			section2 = element("section");
    			h12 = element("h1");
    			h12.textContent = "Combat";
    			t26 = space();
    			div = element("div");
    			dl1 = element("dl");
    			dt5 = element("dt");
    			dt5.textContent = "Speed";
    			dd5 = element("dd");
    			t28 = text(t28_value);
    			dt6 = element("dt");
    			dt6.textContent = "Melee skill";
    			dd6 = element("dd");
    			t30 = text(t30_value);
    			dt7 = element("dt");
    			dt7.textContent = "Damage";
    			dd7 = element("dd");
    			t32 = text(t32_value);
    			if (if_block0) if_block0.c();
    			t33 = space();
    			dl3 = element("dl");
    			dt8 = element("dt");
    			dt8.textContent = "HP";
    			dd8 = element("dd");
    			t35 = text(t35_value);
    			dt9 = element("dt");
    			dt9.textContent = "Dodge";
    			dd9 = element("dd");
    			t37 = text(t37_value);
    			dt10 = element("dt");
    			dt10.textContent = "Armor";
    			dd16 = element("dd");
    			dl2 = element("dl");
    			dt11 = element("dt");
    			dt11.textContent = "Bash";
    			dd10 = element("dd");
    			t40 = text(t40_value);
    			dt12 = element("dt");
    			dt12.textContent = "Cut";
    			dd11 = element("dd");
    			t42 = text(t42_value);
    			dt13 = element("dt");
    			dt13.textContent = "Stab";
    			dd12 = element("dd");
    			t44 = text(t44_value);
    			dt14 = element("dt");
    			dt14.textContent = "Bullet";
    			dd13 = element("dd");
    			t46 = text(t46_value);
    			dt15 = element("dt");
    			dt15.textContent = "Acid";
    			dd14 = element("dd");
    			t48 = text(t48_value);
    			dt16 = element("dt");
    			dt16.textContent = "Fire";
    			dd15 = element("dd");
    			t50 = text(t50_value);
    			t51 = space();
    			section3 = element("section");
    			h13 = element("h1");
    			h13.textContent = "Behavior";
    			t53 = space();
    			dl4 = element("dl");
    			dt17 = element("dt");
    			dt17.textContent = "Aggression";
    			dd17 = element("dd");
    			t55 = text(t55_value);
    			dt18 = element("dt");
    			dt18.textContent = "Morale";
    			dd18 = element("dd");
    			t57 = text(t57_value);
    			dt19 = element("dt");
    			dt19.textContent = "Default faction";
    			dd19 = element("dd");
    			t59 = text(t59_value);
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    			if (if_block2) if_block2.c();
    			dt20 = element("dt");
    			dt20.textContent = "Flags";
    			dd20 = element("dd");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			dt21 = element("dt");
    			dt21.textContent = "On death";
    			dd21 = element("dd");
    			t62 = text(t62_value);
    			set_style(span0, "font-family", "monospace");
    			attr_dev(span0, "class", span0_class_value = "c_" + /*item*/ ctx[0].color);
    			add_location(span0, file$6, 190, 4, 10309);
    			add_location(h10, file$6, 190, 0, 10305);
    			add_location(p0, file$6, 192, 2, 10429);
    			attr_dev(span1, "class", span1_class_value = "c_" + difficultyColor(difficulty(/*item*/ ctx[0])) + " fg_only");
    			add_location(span1, file$6, 193, 36, 10491);
    			add_location(p1, file$6, 193, 2, 10457);
    			add_location(section0, file$6, 191, 0, 10417);
    			add_location(h11, file$6, 196, 2, 10629);
    			add_location(dt0, file$6, 198, 4, 10654);
    			add_location(dd0, file$6, 198, 22, 10672);
    			add_location(dt1, file$6, 199, 4, 10701);
    			add_location(dd1, file$6, 199, 20, 10717);
    			add_location(dt2, file$6, 200, 4, 10764);
    			add_location(dd2, file$6, 200, 19, 10779);
    			add_location(dt3, file$6, 201, 4, 10806);
    			add_location(dd3, file$6, 201, 19, 10821);
    			add_location(dt4, file$6, 202, 4, 10848);
    			attr_dev(ul, "class", "comma-separated");
    			add_location(ul, file$6, 204, 6, 10881);
    			add_location(dd4, file$6, 203, 4, 10870);
    			add_location(dl0, file$6, 197, 2, 10645);
    			add_location(section1, file$6, 195, 0, 10617);
    			add_location(h12, file$6, 209, 2, 11034);
    			add_location(dt5, file$6, 212, 4, 11148);
    			add_location(dd5, file$6, 212, 18, 11162);
    			add_location(dt6, file$6, 213, 4, 11188);
    			add_location(dd6, file$6, 213, 24, 11208);
    			add_location(dt7, file$6, 214, 4, 11245);
    			add_location(dd7, file$6, 214, 19, 11260);
    			set_style(dl1, "flex", "1");
    			add_location(dl1, file$6, 211, 2, 11123);
    			add_location(dt8, file$6, 226, 4, 11573);
    			add_location(dd8, file$6, 226, 15, 11584);
    			add_location(dt9, file$6, 227, 4, 11607);
    			add_location(dd9, file$6, 227, 18, 11621);
    			add_location(dt10, file$6, 228, 4, 11652);
    			add_location(dt11, file$6, 231, 8, 11695);
    			add_location(dd10, file$6, 231, 21, 11708);
    			add_location(dt12, file$6, 232, 8, 11748);
    			add_location(dd11, file$6, 232, 20, 11760);
    			add_location(dt13, file$6, 233, 8, 11799);
    			add_location(dd12, file$6, 233, 21, 11812);
    			add_location(dt14, file$6, 234, 8, 11890);
    			add_location(dd13, file$6, 234, 23, 11905);
    			add_location(dt15, file$6, 235, 8, 11947);
    			add_location(dd14, file$6, 235, 21, 11960);
    			add_location(dt16, file$6, 236, 8, 12038);
    			add_location(dd15, file$6, 236, 21, 12051);
    			add_location(dl2, file$6, 230, 6, 11682);
    			add_location(dd16, file$6, 229, 4, 11671);
    			set_style(dl3, "flex", "1");
    			add_location(dl3, file$6, 225, 2, 11548);
    			set_style(div, "display", "flex");
    			set_style(div, "flex-direction", "row");
    			set_style(div, "align-items", "start");
    			add_location(div, file$6, 210, 2, 11052);
    			add_location(section2, file$6, 208, 0, 11022);
    			add_location(h13, file$6, 243, 2, 12145);
    			add_location(dt17, file$6, 245, 4, 12174);
    			add_location(dd17, file$6, 245, 23, 12193);
    			add_location(dt18, file$6, 246, 4, 12224);
    			add_location(dd18, file$6, 246, 19, 12239);
    			add_location(dt19, file$6, 247, 4, 12266);
    			add_location(dd19, file$6, 247, 28, 12290);
    			add_location(dt20, file$6, 254, 4, 12550);
    			add_location(dd20, file$6, 254, 18, 12564);
    			add_location(dt21, file$6, 255, 4, 12713);
    			add_location(dd21, file$6, 255, 21, 12730);
    			add_location(dl4, file$6, 244, 2, 12165);
    			add_location(section3, file$6, 242, 0, 12133);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h10, anchor);
    			append_dev(h10, span0);
    			append_dev(span0, t0);
    			append_dev(h10, t1);
    			append_dev(h10, t2);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, section0, anchor);
    			append_dev(section0, p0);
    			append_dev(p0, t4);
    			append_dev(section0, t5);
    			append_dev(section0, p1);
    			append_dev(p1, t6);
    			append_dev(p1, t7);
    			append_dev(p1, t8);
    			append_dev(p1, span1);
    			append_dev(span1, t9);
    			append_dev(span1, t10);
    			append_dev(span1, t11);
    			insert_dev(target, t12, anchor);
    			insert_dev(target, section1, anchor);
    			append_dev(section1, h11);
    			append_dev(section1, t14);
    			append_dev(section1, dl0);
    			append_dev(dl0, dt0);
    			append_dev(dl0, dd0);
    			append_dev(dd0, t16);
    			append_dev(dl0, dt1);
    			append_dev(dl0, dd1);
    			append_dev(dd1, t18);
    			append_dev(dl0, dt2);
    			append_dev(dl0, dd2);
    			append_dev(dd2, t20);
    			append_dev(dl0, dt3);
    			append_dev(dl0, dd3);
    			append_dev(dd3, t22);
    			append_dev(dl0, dt4);
    			append_dev(dl0, dd4);
    			append_dev(dd4, ul);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(ul, null);
    			}

    			insert_dev(target, t24, anchor);
    			insert_dev(target, section2, anchor);
    			append_dev(section2, h12);
    			append_dev(section2, t26);
    			append_dev(section2, div);
    			append_dev(div, dl1);
    			append_dev(dl1, dt5);
    			append_dev(dl1, dd5);
    			append_dev(dd5, t28);
    			append_dev(dl1, dt6);
    			append_dev(dl1, dd6);
    			append_dev(dd6, t30);
    			append_dev(dl1, dt7);
    			append_dev(dl1, dd7);
    			append_dev(dd7, t32);
    			if (if_block0) if_block0.m(dl1, null);
    			append_dev(div, t33);
    			append_dev(div, dl3);
    			append_dev(dl3, dt8);
    			append_dev(dl3, dd8);
    			append_dev(dd8, t35);
    			append_dev(dl3, dt9);
    			append_dev(dl3, dd9);
    			append_dev(dd9, t37);
    			append_dev(dl3, dt10);
    			append_dev(dl3, dd16);
    			append_dev(dd16, dl2);
    			append_dev(dl2, dt11);
    			append_dev(dl2, dd10);
    			append_dev(dd10, t40);
    			append_dev(dl2, dt12);
    			append_dev(dl2, dd11);
    			append_dev(dd11, t42);
    			append_dev(dl2, dt13);
    			append_dev(dl2, dd12);
    			append_dev(dd12, t44);
    			append_dev(dl2, dt14);
    			append_dev(dl2, dd13);
    			append_dev(dd13, t46);
    			append_dev(dl2, dt15);
    			append_dev(dl2, dd14);
    			append_dev(dd14, t48);
    			append_dev(dl2, dt16);
    			append_dev(dl2, dd15);
    			append_dev(dd15, t50);
    			insert_dev(target, t51, anchor);
    			insert_dev(target, section3, anchor);
    			append_dev(section3, h13);
    			append_dev(section3, t53);
    			append_dev(section3, dl4);
    			append_dev(dl4, dt17);
    			append_dev(dl4, dd17);
    			append_dev(dd17, t55);
    			append_dev(dl4, dt18);
    			append_dev(dl4, dd18);
    			append_dev(dd18, t57);
    			append_dev(dl4, dt19);
    			append_dev(dl4, dd19);
    			append_dev(dd19, t59);
    			if (if_block1) if_block1.m(dl4, null);
    			append_dev(dl4, if_block1_anchor);
    			if (if_block2) if_block2.m(dl4, null);
    			append_dev(dl4, dt20);
    			append_dev(dl4, dd20);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(dd20, null);
    			}

    			append_dev(dl4, dt21);
    			append_dev(dl4, dd21);
    			append_dev(dd21, t62);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*item*/ 1 && t0_value !== (t0_value = /*item*/ ctx[0].symbol + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*item*/ 1 && span0_class_value !== (span0_class_value = "c_" + /*item*/ ctx[0].color)) {
    				attr_dev(span0, "class", span0_class_value);
    			}

    			if (dirty & /*item*/ 1 && t2_value !== (t2_value = singularName(/*item*/ ctx[0]) + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*item*/ 1 && t4_value !== (t4_value = /*item*/ ctx[0].description + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*item*/ 1 && t7_value !== (t7_value = difficulty(/*item*/ ctx[0]) + "")) set_data_dev(t7, t7_value);
    			if (dirty & /*item*/ 1 && t10_value !== (t10_value = difficultyDescription(difficulty(/*item*/ ctx[0])) + "")) set_data_dev(t10, t10_value);

    			if (dirty & /*item*/ 1 && span1_class_value !== (span1_class_value = "c_" + difficultyColor(difficulty(/*item*/ ctx[0])) + " fg_only")) {
    				attr_dev(span1, "class", span1_class_value);
    			}

    			if (dirty & /*item*/ 1 && t16_value !== (t16_value = /*item*/ ctx[0].bodytype + "")) set_data_dev(t16, t16_value);
    			if (dirty & /*item*/ 1 && t18_value !== (t18_value = (/*item*/ ctx[0].species ?? []).join(", ") + "")) set_data_dev(t18, t18_value);
    			if (dirty & /*item*/ 1 && t20_value !== (t20_value = /*item*/ ctx[0].volume + "")) set_data_dev(t20, t20_value);
    			if (dirty & /*item*/ 1 && t22_value !== (t22_value = /*item*/ ctx[0].weight + "")) set_data_dev(t22, t22_value);

    			if (dirty & /*materials*/ 4) {
    				each_value_2 = /*materials*/ ctx[2];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2$2(ctx, each_value_2, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_2$2(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_2.length;
    			}

    			if (dirty & /*item*/ 1 && t28_value !== (t28_value = /*item*/ ctx[0].speed + "")) set_data_dev(t28, t28_value);
    			if (dirty & /*item*/ 1 && t30_value !== (t30_value = (/*item*/ ctx[0].melee_skill ?? 0) + "")) set_data_dev(t30, t30_value);
    			if (dirty & /*item*/ 1 && t32_value !== (t32_value = damage(/*item*/ ctx[0]) + "")) set_data_dev(t32, t32_value);

    			if (/*item*/ ctx[0].special_attacks) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_3$2(ctx);
    					if_block0.c();
    					if_block0.m(dl1, null);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (dirty & /*item*/ 1 && t35_value !== (t35_value = /*item*/ ctx[0].hp + "")) set_data_dev(t35, t35_value);
    			if (dirty & /*item*/ 1 && t37_value !== (t37_value = (/*item*/ ctx[0].dodge ?? 0) + "")) set_data_dev(t37, t37_value);
    			if (dirty & /*item*/ 1 && t40_value !== (t40_value = (/*item*/ ctx[0].armor_bash ?? 0) + "")) set_data_dev(t40, t40_value);
    			if (dirty & /*item*/ 1 && t42_value !== (t42_value = (/*item*/ ctx[0].armor_cut ?? 0) + "")) set_data_dev(t42, t42_value);
    			if (dirty & /*item*/ 1 && t44_value !== (t44_value = (/*item*/ ctx[0].armor_stab ?? Math.floor((/*item*/ ctx[0].armor_cut ?? 0) * 0.8)) + "")) set_data_dev(t44, t44_value);
    			if (dirty & /*item*/ 1 && t46_value !== (t46_value = (/*item*/ ctx[0].armor_bullet ?? 0) + "")) set_data_dev(t46, t46_value);
    			if (dirty & /*item*/ 1 && t48_value !== (t48_value = (/*item*/ ctx[0].armor_acid ?? Math.floor((/*item*/ ctx[0].armor_cut ?? 0) * 0.5)) + "")) set_data_dev(t48, t48_value);
    			if (dirty & /*item*/ 1 && t50_value !== (t50_value = (/*item*/ ctx[0].armor_fire ?? 0) + "")) set_data_dev(t50, t50_value);
    			if (dirty & /*item*/ 1 && t55_value !== (t55_value = /*item*/ ctx[0].aggression + "")) set_data_dev(t55, t55_value);
    			if (dirty & /*item*/ 1 && t57_value !== (t57_value = /*item*/ ctx[0].morale + "")) set_data_dev(t57, t57_value);
    			if (dirty & /*item*/ 1 && t59_value !== (t59_value = /*item*/ ctx[0].default_faction + "")) set_data_dev(t59, t59_value);

    			if (/*item*/ ctx[0].anger_triggers) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_2$2(ctx);
    					if_block1.c();
    					if_block1.m(dl4, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*item*/ ctx[0].placate_triggers) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block_1$4(ctx);
    					if_block2.c();
    					if_block2.m(dl4, dt20);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (dirty & /*item, mon_flag_descriptions*/ 3) {
    				each_value = /*item*/ ctx[0].flags ?? [];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(dd20, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*item*/ 1 && t62_value !== (t62_value = (/*item*/ ctx[0].death_function ?? []).join(", ") + "")) set_data_dev(t62, t62_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h10);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(section0);
    			if (detaching) detach_dev(t12);
    			if (detaching) detach_dev(section1);
    			destroy_each(each_blocks_1, detaching);
    			if (detaching) detach_dev(t24);
    			if (detaching) detach_dev(section2);
    			if (if_block0) if_block0.d();
    			if (detaching) detach_dev(t51);
    			if (detaching) detach_dev(section3);
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function difficulty(item) {
    	const { melee_skill = 0, melee_dice = 0, melee_cut: bonus_cut = 0, melee_dice_sides: melee_sides = 0, dodge: sk_dodge = 0, armor_bash = -1, armor_cut = -1, diff: difficulty_base = 0, special_attacks = [], emit_fields = [], hp, speed, attack_cost = 100, morale = 0, aggression: agro = 0, vision_day = 40, vision_night = 1 } = item;
    	let difficulty = (melee_skill + 1) * melee_dice * (bonus_cut + melee_sides) * 0.04 + (sk_dodge + 1) * (3 + armor_bash + armor_cut) * 0.04 + (difficulty_base + special_attacks.length + 8 * emit_fields.length);
    	difficulty = Math.floor(difficulty);
    	difficulty *= (hp + speed - attack_cost + (morale + agro) * 0.1) * 0.01 + (vision_day + 2 * vision_night) * 0.01;
    	return Math.floor(difficulty);
    }

    function difficultyDescription(diff) {
    	if (diff < 3) {
    		return "Minimal threat.";
    	} else if (diff < 10) {
    		return "Mildly dangerous.";
    	} else if (diff < 20) {
    		return "Dangerous.";
    	} else if (diff < 30) {
    		return "Very dangerous.";
    	} else if (diff < 50) {
    		return "Extremely dangerous.";
    	}

    	return "Fatally dangerous!";
    }

    function difficultyColor(diff) {
    	if (diff < 3) {
    		return "light_gray";
    	} else if (diff < 10) {
    		return "light_gray";
    	} else if (diff < 20) {
    		return "light_red";
    	} else if (diff < 30) {
    		return "red";
    	} else if (diff < 50) {
    		return "red";
    	}

    	return "red";
    }

    function damage(item) {
    	let { melee_dice = 0, melee_dice_sides = 0, melee_damage, melee_cut } = item;

    	//melee_damage = melee_damage ?? [ { damage_type: "bash", amount: `${melee_dice}d${melee_dice_sides}` } ]
    	return `${melee_dice}d${melee_dice_sides}`;
    }

    function specialAttackToString(special_attack) {
    	if (Array.isArray(special_attack)) if (special_attack.length > 1) return `${special_attack[0]} (cooldown: ${special_attack[1]})`; else return special_attack[0];
    	if ("type" in special_attack) if ("cooldown" in special_attack) return `${special_attack.type} (cooldown: ${special_attack.cooldown})`; else return special_attack.type;

    	if ("id" in special_attack) if ("damage_max_instance" in special_attack) return `${special_attack.id}: ${special_attack.damage_max_instance.map(inst => {
		return `(${inst.damage_type} for ${inst.amount} damage)`;
	}).join(" ")}`; else return special_attack.id;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let $data;
    	validate_store(data, "data");
    	component_subscribe($$self, data, $$value => $$invalidate(4, $data = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Monster", slots, []);
    	var _a;
    	let { item } = $$props;

    	// From mtype.h. See also http://cddawiki.chezzo.com/cdda_wiki/index.php?title=Template:Enemyflags&action=edit.
    	const mon_flag_descriptions = {
    		SEES: "It can see you (and will run/follow)",
    		HEARS: "It can hear you",
    		GOODHEARING: "Pursues sounds more than most monsters",
    		SMELLS: "It can smell you",
    		KEENNOSE: "Keen sense of smell",
    		STUMBLES: "Stumbles in its movement",
    		WARM: "Warm blooded",
    		NOHEAD: "Headshots not allowed!",
    		HARDTOSHOOT: "It's one size smaller for ranged attacks, no less then creature_size::tiny",
    		GRABS: "Its attacks may grab us!",
    		BASHES: "Bashes down doors",
    		DESTROYS: "Bashes down walls and more",
    		BORES: "Tunnels through just about anything",
    		POISON: "Poisonous to eat",
    		VENOM: "Attack may poison the player",
    		BADVENOM: "Attack may SEVERELY poison the player",
    		PARALYZE: "Attack may paralyze the player with venom",
    		WEBWALK: "Doesn't destroy webs",
    		DIGS: "Digs through the ground",
    		CAN_DIG: "Can dig and walk",
    		FLIES: "Can fly (over water, etc)",
    		AQUATIC: "Confined to water",
    		SWIMS: "Treats water as 50 movement point terrain",
    		ATTACKMON: "Attacks other monsters",
    		ANIMAL: "Is an \"animal\" for purposes of the Animal Empath trait",
    		PLASTIC: "Absorbs physical damage to a great degree",
    		SUNDEATH: "Dies in full sunlight",
    		ELECTRIC: "Shocks unarmed attackers",
    		ACIDPROOF: "Immune to acid",
    		ACIDTRAIL: "Leaves a trail of acid",
    		SHORTACIDTRAIL: "Leaves an intermittent trail of acid",
    		FIREPROOF: "Immune to fire",
    		SLUDGEPROOF: "Ignores the effect of sludge trails",
    		SLUDGETRAIL: "Causes monster to leave a sludge trap trail when moving",
    		COLDPROOF: "Immune to cold damage",
    		FIREY: "Burns stuff and is immune to fire",
    		QUEEN: "When it dies, local populations start to die off too",
    		ELECTRONIC: "e.g. a robot; affected by EMP blasts, and other stuff",
    		FUR: "May produce fur when butchered",
    		LEATHER: "May produce leather when butchered",
    		WOOL: "May produce wool when butchered",
    		BONES: "May produce bones and sinews when butchered; if combined with POISON flag, tainted bones, if combined with HUMAN, human bones",
    		FAT: "May produce fat when butchered; if combined with POISON flag, tainted fat",
    		CONSOLE_DESPAWN: "Despawns when a nearby console is properly hacked",
    		IMMOBILE: "Doesn't move (e.g. turrets)",
    		ID_CARD_DESPAWN: "Despawns when a science ID card is used on a nearby console",
    		RIDEABLE_MECH: "A rideable mech that is immobile until ridden.",
    		MILITARY_MECH: "A rideable mech that was designed for military work.",
    		MECH_RECON_VISION: "This mech gives you IR night-vision.",
    		MECH_DEFENSIVE: "This mech gives you thorough protection.",
    		HIT_AND_RUN: "Flee for several turns after a melee attack",
    		GUILT: "You feel guilty for killing it",
    		PAY_BOT: "You can pay this bot to be your friend for a time",
    		HUMAN: "It's a live human, as long as it's alive",
    		NO_BREATHE: "Creature can't drown and is unharmed by gas, smoke, or poison",
    		FLAMMABLE: "Monster catches fire, burns, and spreads fire to nearby objects",
    		REVIVES: "Monster corpse will revive after a short period of time",
    		CHITIN: "May produce chitin when butchered",
    		VERMIN: "Obsolete flag labeling \"nuisance\" or \"scenery\" monsters, now used to prevent loading the same.",
    		NOGIB: "Creature won't leave gibs / meat chunks when killed with huge damage.",
    		LARVA: "Creature is a larva. Currently used for gib and blood handling.",
    		ARTHROPOD_BLOOD: "Forces monster to bleed hemolymph.",
    		ACID_BLOOD: "Makes monster bleed acid. Fun stuff! Does not automatically dissolve in a pool of acid on death.",
    		BILE_BLOOD: "Makes monster bleed bile.",
    		ABSORBS: "Consumes objects it moves over which gives bonus hp.",
    		ABSORBS_SPLITS: "Consumes objects it moves over which gives bonus hp. If it gets enough bonus HP, it spawns a copy of itself.",
    		CBM_CIV: "May produce a common CBM a power CBM when butchered.",
    		CBM_POWER: "May produce a power CBM when butchered, independent of MF_CBM_wev.",
    		CBM_SCI: "May produce a bionic from bionics_sci when butchered.",
    		CBM_OP: "May produce a bionic from bionics_op when butchered, and the power storage is mk 2.",
    		CBM_TECH: "May produce a bionic from bionics_tech when butchered.",
    		CBM_SUBS: "May produce a bionic from bionics_subs when butchered.",
    		FILTHY: "Any clothing it drops will be filthy.",
    		FISHABLE: "It is fishable.",
    		GROUP_BASH: "Monsters that can pile up against obstacles and add their strength together to break them.",
    		SWARMS: "Monsters that like to group together and form loose packs",
    		GROUP_MORALE: "Monsters that are more courageous when near friends",
    		INTERIOR_AMMO: "Monster contain's its ammo inside itself, no need to load on launch. Prevents ammo from being dropped on disable.",
    		CLIMBS: "Monsters that can climb certain terrain and furniture",
    		PACIFIST: "Monsters that will never use melee attack, useful for having them use grab without attacking the player",
    		PUSH_MON: "Monsters that can push creatures out of their way",
    		PUSH_VEH: "Monsters that can push vehicles out of their way",
    		NIGHT_INVISIBILITY: "Monsters that are invisible in poor light conditions",
    		REVIVES_HEALTHY: "When revived, this monster has full hitpoints and speed",
    		NO_NECRO: "This monster can't be revived by necros. It will still rise on its own.",
    		AVOID_DANGER_1: "This monster will path around some dangers instead of through them.",
    		AVOID_DANGER_2: "This monster will path around most dangers instead of through them.",
    		AVOID_FIRE: "This monster will path around heat-related dangers instead of through them.",
    		AVOID_FALL: "This monster will path around cliffs instead of off of them.",
    		PRIORITIZE_TARGETS: "This monster will prioritize targets depending on their danger levels",
    		NOT_HALLU: "Monsters that will NOT appear when player's producing hallucinations",
    		CATFOOD: "This monster will become friendly when fed cat food.",
    		CATTLEFODDER: "This monster will become friendly when fed cattle fodder.",
    		BIRDFOOD: "This monster will become friendly when fed bird food.",
    		CANPLAY: "This monster can be played with if it's a pet.",
    		PET_MOUNTABLE: "This monster can be mounted and ridden when tamed.",
    		PET_HARNESSABLE: "This monster can be harnessed when tamed.",
    		DOGFOOD: "This monster will become friendly when fed dog food.",
    		MILKABLE: "This monster is milkable.",
    		SHEARABLE: "This monster is shearable.",
    		NO_BREED: "This monster doesn't breed, even though it has breed data",
    		PET_WONT_FOLLOW: "This monster won't follow the player automatically when tamed.",
    		DRIPS_NAPALM: "This monster occasionally drips napalm on move",
    		DRIPS_GASOLINE: "This monster occasionally drips gasoline on move",
    		ELECTRIC_FIELD: "This monster is surrounded by an electrical field that ignites flammable liquids near it",
    		LOUDMOVES: "This monster makes move noises as if ~2 sizes louder, even if flying.",
    		CAN_OPEN_DOORS: "This monster can open doors.",
    		STUN_IMMUNE: "This monster is immune to the stun effect",
    		DROPS_AMMO: "This monster drops ammo. Should not be set for monsters that use pseudo ammo.",
    		INSECTICIDEPROOF: "This monster is immune to insecticide, even though it's made of bug flesh",
    		RANGED_ATTACKER: "This monster has any sort of ranged attack"
    	};

    	let materials = ((_a = item.material) !== null && _a !== void 0 ? _a : []).map(id => $data.byId("material", id));
    	const writable_props = ["item"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Monster> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("item" in $$props) $$invalidate(0, item = $$props.item);
    	};

    	$$self.$capture_state = () => ({
    		_a,
    		singularName,
    		data,
    		item,
    		difficulty,
    		difficultyDescription,
    		difficultyColor,
    		damage,
    		mon_flag_descriptions,
    		specialAttackToString,
    		materials,
    		$data
    	});

    	$$self.$inject_state = $$props => {
    		if ("_a" in $$props) _a = $$props._a;
    		if ("item" in $$props) $$invalidate(0, item = $$props.item);
    		if ("materials" in $$props) $$invalidate(2, materials = $$props.materials);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [item, mon_flag_descriptions, materials];
    }

    class Monster extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { item: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Monster",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*item*/ ctx[0] === undefined && !("item" in props)) {
    			console.warn("<Monster> was created without expected prop 'item'");
    		}
    	}

    	get item() {
    		throw new Error("<Monster>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set item(value) {
    		throw new Error("<Monster>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/types/Recipe.svelte generated by Svelte v3.34.0 */

    const { Object: Object_1$2, console: console_1 } = globals;
    const file$5 = "src/types/Recipe.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i];
    	child_ctx[17] = i;
    	return child_ctx;
    }

    function get_each_context_2$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[18] = list[i];
    	return child_ctx;
    }

    function get_each_context_3$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[21] = list[i];
    	child_ctx[17] = i;
    	return child_ctx;
    }

    function get_each_context_4$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[23] = list[i];
    	return child_ctx;
    }

    function get_each_context_5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[26] = list[i];
    	return child_ctx;
    }

    function get_each_context_6(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[29] = list[i][0];
    	child_ctx[30] = list[i][1];
    	child_ctx[17] = i;
    	return child_ctx;
    }

    // (62:2) {#if skillsRequired.length}
    function create_if_block_6(ctx) {
    	let dt;
    	let dd;
    	let t1;
    	let each_value_6 = /*skillsRequired*/ ctx[6];
    	validate_each_argument(each_value_6);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_6.length; i += 1) {
    		each_blocks[i] = create_each_block_6(get_each_context_6(ctx, each_value_6, i));
    	}

    	let each_1_else = null;

    	if (!each_value_6.length) {
    		each_1_else = create_else_block_1(ctx);
    	}

    	const block = {
    		c: function create() {
    			dt = element("dt");
    			dt.textContent = "Other skills";
    			dd = element("dd");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			if (each_1_else) {
    				each_1_else.c();
    			}

    			t1 = space();
    			add_location(dt, file$5, 62, 2, 2885);
    			add_location(dd, file$5, 63, 2, 2909);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, dt, anchor);
    			insert_dev(target, dd, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(dd, null);
    			}

    			if (each_1_else) {
    				each_1_else.m(dd, null);
    			}

    			append_dev(dd, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*skillsRequired*/ 64) {
    				each_value_6 = /*skillsRequired*/ ctx[6];
    				validate_each_argument(each_value_6);
    				let i;

    				for (i = 0; i < each_value_6.length; i += 1) {
    					const child_ctx = get_each_context_6(ctx, each_value_6, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_6(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(dd, t1);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_6.length;

    				if (each_value_6.length) {
    					if (each_1_else) {
    						each_1_else.d(1);
    						each_1_else = null;
    					}
    				} else if (!each_1_else) {
    					each_1_else = create_else_block_1(ctx);
    					each_1_else.c();
    					each_1_else.m(dd, t1);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(dt);
    			if (detaching) detach_dev(dd);
    			destroy_each(each_blocks, detaching);
    			if (each_1_else) each_1_else.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(62:2) {#if skillsRequired.length}",
    		ctx
    	});

    	return block;
    }

    // (67:4) {:else}
    function create_else_block_1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("none");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(67:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (66:139) 
    function create_if_block_8(ctx) {
    	let t_value = ", " + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_8.name,
    		type: "if",
    		source: "(66:139) ",
    		ctx
    	});

    	return block;
    }

    // (66:51) {#if i === skillsRequired.length - 2}
    function create_if_block_7(ctx) {
    	let t_value = " and " + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(66:51) {#if i === skillsRequired.length - 2}",
    		ctx
    	});

    	return block;
    }

    // (65:4) {#each skillsRequired as [skill, level], i}
    function create_each_block_6(ctx) {
    	let a;
    	let t0_value = /*skill*/ ctx[29] + "";
    	let t0;
    	let t1;
    	let t2_value = /*level*/ ctx[30] + "";
    	let t2;
    	let t3;
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*i*/ ctx[17] === /*skillsRequired*/ ctx[6].length - 2) return create_if_block_7;
    		if (/*i*/ ctx[17] !== /*skillsRequired*/ ctx[6].length - 1) return create_if_block_8;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type && current_block_type(ctx);

    	const block = {
    		c: function create() {
    			a = element("a");
    			t0 = text(t0_value);
    			t1 = text(" (");
    			t2 = text(t2_value);
    			t3 = text(")");
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr_dev(a, "href", "#/skill/" + /*skill*/ ctx[29]);
    			add_location(a, file$5, 65, 4, 2966);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, t3, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(t3);

    			if (if_block) {
    				if_block.d(detaching);
    			}

    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_6.name,
    		type: "each",
    		source: "(65:4) {#each skillsRequired as [skill, level], i}",
    		ctx
    	});

    	return block;
    }

    // (72:2) {#if recipe.proficiencies}
    function create_if_block_5(ctx) {
    	let dt;
    	let dd;
    	let ul;
    	let t1;
    	let each_value_5 = /*recipe*/ ctx[0].proficiencies ?? [];
    	validate_each_argument(each_value_5);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_5.length; i += 1) {
    		each_blocks[i] = create_each_block_5(get_each_context_5(ctx, each_value_5, i));
    	}

    	const block = {
    		c: function create() {
    			dt = element("dt");
    			dt.textContent = "Proficiencies";
    			dd = element("dd");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			add_location(dt, file$5, 72, 2, 3193);
    			attr_dev(ul, "class", "svelte-k9dy74");
    			add_location(ul, file$5, 74, 4, 3227);
    			add_location(dd, file$5, 73, 2, 3218);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, dt, anchor);
    			insert_dev(target, dd, anchor);
    			append_dev(dd, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			append_dev(dd, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*recipe, $data*/ 3) {
    				each_value_5 = /*recipe*/ ctx[0].proficiencies ?? [];
    				validate_each_argument(each_value_5);
    				let i;

    				for (i = 0; i < each_value_5.length; i += 1) {
    					const child_ctx = get_each_context_5(ctx, each_value_5, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_5(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_5.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(dt);
    			if (detaching) detach_dev(dd);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(72:2) {#if recipe.proficiencies}",
    		ctx
    	});

    	return block;
    }

    // (76:4) {#each recipe.proficiencies ?? [] as prof}
    function create_each_block_5(ctx) {
    	let li;
    	let a;
    	let t_value = singularName(/*$data*/ ctx[1].byId("proficiency", /*prof*/ ctx[26].proficiency)) + "";
    	let t;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			li = element("li");
    			a = element("a");
    			t = text(t_value);
    			attr_dev(a, "href", a_href_value = "#/proficiency/" + /*prof*/ ctx[26].proficiency);
    			add_location(a, file$5, 76, 8, 3287);
    			add_location(li, file$5, 76, 4, 3283);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, a);
    			append_dev(a, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$data, recipe*/ 3 && t_value !== (t_value = singularName(/*$data*/ ctx[1].byId("proficiency", /*prof*/ ctx[26].proficiency)) + "")) set_data_dev(t, t_value);

    			if (dirty[0] & /*recipe*/ 1 && a_href_value !== (a_href_value = "#/proficiency/" + /*prof*/ ctx[26].proficiency)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_5.name,
    		type: "each",
    		source: "(76:4) {#each recipe.proficiencies ?? [] as prof}",
    		ctx
    	});

    	return block;
    }

    // (89:6) {#each qualities ?? [] as quality}
    function create_each_block_4$1(ctx) {
    	let li;
    	let t0_value = (/*quality*/ ctx[23].amount ?? 1) + "";
    	let t0;
    	let t1;
    	let t2_value = ((/*quality*/ ctx[23].amount ?? 1) === 1 ? "" : "s") + "";
    	let t2;
    	let t3;
    	let a;
    	let t4_value = singularName(/*$data*/ ctx[1].byId("tool_quality", /*quality*/ ctx[23].id)) + "";
    	let t4;
    	let t5;
    	let t6_value = /*quality*/ ctx[23].level + "";
    	let t6;
    	let t7;

    	const block = {
    		c: function create() {
    			li = element("li");
    			t0 = text(t0_value);
    			t1 = text(" tool");
    			t2 = text(t2_value);
    			t3 = text(" with ");
    			a = element("a");
    			t4 = text(t4_value);
    			t5 = text(" of ");
    			t6 = text(t6_value);
    			t7 = text(" or more.");
    			attr_dev(a, "href", "#/tool_quality/" + /*quality*/ ctx[23].id);
    			add_location(a, file$5, 89, 84, 3814);
    			add_location(li, file$5, 89, 8, 3738);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, t0);
    			append_dev(li, t1);
    			append_dev(li, t2);
    			append_dev(li, t3);
    			append_dev(li, a);
    			append_dev(a, t4);
    			append_dev(li, t5);
    			append_dev(li, t6);
    			append_dev(li, t7);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$data*/ 2 && t4_value !== (t4_value = singularName(/*$data*/ ctx[1].byId("tool_quality", /*quality*/ ctx[23].id)) + "")) set_data_dev(t4, t4_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_4$1.name,
    		type: "each",
    		source: "(89:6) {#each qualities ?? [] as quality}",
    		ctx
    	});

    	return block;
    }

    // (95:10) {#if i !== 0}
    function create_if_block_4$1(ctx) {
    	let t_value = " OR " + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$1.name,
    		type: "if",
    		source: "(95:10) {#if i !== 0}",
    		ctx
    	});

    	return block;
    }

    // (98:10) {:else}
    function create_else_block$4(ctx) {
    	let a;
    	let t_value = singularName(/*$data*/ ctx[1].byId("item", /*tool*/ ctx[21].id)) + "";
    	let t;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text(t_value);
    			attr_dev(a, "href", "#/item/" + /*tool*/ ctx[21].id);
    			add_location(a, file$5, 98, 10, 4274);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$data*/ 2 && t_value !== (t_value = singularName(/*$data*/ ctx[1].byId("item", /*tool*/ ctx[21].id)) + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$4.name,
    		type: "else",
    		source: "(98:10) {:else}",
    		ctx
    	});

    	return block;
    }

    // (96:10) {#if $data.craftingPseudoItem(tool.id)}
    function create_if_block_3$1(ctx) {
    	let a;
    	let t_value = singularName(/*$data*/ ctx[1].byId("item", /*tool*/ ctx[21].id)) + "";
    	let t;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text(t_value);
    			attr_dev(a, "href", a_href_value = "#/furniture/" + /*$data*/ ctx[1].craftingPseudoItem(/*tool*/ ctx[21].id));
    			add_location(a, file$5, 96, 10, 4140);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$data*/ 2 && t_value !== (t_value = singularName(/*$data*/ ctx[1].byId("item", /*tool*/ ctx[21].id)) + "")) set_data_dev(t, t_value);

    			if (dirty[0] & /*$data*/ 2 && a_href_value !== (a_href_value = "#/furniture/" + /*$data*/ ctx[1].craftingPseudoItem(/*tool*/ ctx[21].id))) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(96:10) {#if $data.craftingPseudoItem(tool.id)}",
    		ctx
    	});

    	return block;
    }

    // (101:10) {#if tool.count > 0}
    function create_if_block_1$3(ctx) {
    	let t0;
    	let t1_value = /*tool*/ ctx[21].count + "";
    	let t1;
    	let t2;
    	let t3;
    	let if_block = /*tool*/ ctx[21].count !== 1 && create_if_block_2$1(ctx);

    	const block = {
    		c: function create() {
    			t0 = text("(");
    			t1 = text(t1_value);
    			t2 = text(" charge");
    			if (if_block) if_block.c();
    			t3 = text(")");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, t2, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t3, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(t2);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(101:10) {#if tool.count > 0}",
    		ctx
    	});

    	return block;
    }

    // (101:50) {#if tool.count !== 1}
    function create_if_block_2$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("s");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(101:50) {#if tool.count !== 1}",
    		ctx
    	});

    	return block;
    }

    // (94:8) {#each toolChoices as tool, i}
    function create_each_block_3$1(ctx) {
    	let t0;
    	let show_if;
    	let t1;
    	let if_block2_anchor;
    	let if_block0 = /*i*/ ctx[17] !== 0 && create_if_block_4$1(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (show_if == null || dirty[0] & /*$data*/ 2) show_if = !!/*$data*/ ctx[1].craftingPseudoItem(/*tool*/ ctx[21].id);
    		if (show_if) return create_if_block_3$1;
    		return create_else_block$4;
    	}

    	let current_block_type = select_block_type_1(ctx, [-1]);
    	let if_block1 = current_block_type(ctx);
    	let if_block2 = /*tool*/ ctx[21].count > 0 && create_if_block_1$3(ctx);

    	const block = {
    		c: function create() {
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if_block1.c();
    			t1 = space();
    			if (if_block2) if_block2.c();
    			if_block2_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t0, anchor);
    			if_block1.m(target, anchor);
    			insert_dev(target, t1, anchor);
    			if (if_block2) if_block2.m(target, anchor);
    			insert_dev(target, if_block2_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_1(ctx, dirty)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(t1.parentNode, t1);
    				}
    			}

    			if (/*tool*/ ctx[21].count > 0) if_block2.p(ctx, dirty);
    		},
    		d: function destroy(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t0);
    			if_block1.d(detaching);
    			if (detaching) detach_dev(t1);
    			if (if_block2) if_block2.d(detaching);
    			if (detaching) detach_dev(if_block2_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3$1.name,
    		type: "each",
    		source: "(94:8) {#each toolChoices as tool, i}",
    		ctx
    	});

    	return block;
    }

    // (92:6) {#each tools as toolChoices}
    function create_each_block_2$1(ctx) {
    	let li;
    	let t;
    	let each_value_3 = /*toolChoices*/ ctx[18];
    	validate_each_argument(each_value_3);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks[i] = create_each_block_3$1(get_each_context_3$1(ctx, each_value_3, i));
    	}

    	const block = {
    		c: function create() {
    			li = element("li");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			add_location(li, file$5, 92, 6, 3999);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(li, null);
    			}

    			append_dev(li, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*tools, $data*/ 10) {
    				each_value_3 = /*toolChoices*/ ctx[18];
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3$1(ctx, each_value_3, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_3$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(li, t);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_3.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2$1.name,
    		type: "each",
    		source: "(92:6) {#each tools as toolChoices}",
    		ctx
    	});

    	return block;
    }

    // (113:10) {#if i !== 0}
    function create_if_block$4(ctx) {
    	let t_value = " OR " + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(113:10) {#if i !== 0}",
    		ctx
    	});

    	return block;
    }

    // (112:8) {#each componentChoices as comp, i}
    function create_each_block_1$2(ctx) {
    	let t0;
    	let t1_value = /*comp*/ ctx[15].count + "";
    	let t1;
    	let t2;
    	let a;

    	let t3_value = (/*comp*/ ctx[15].count === 1
    	? singularName(/*$data*/ ctx[1].byId("item", /*comp*/ ctx[15].id))
    	: pluralName(/*$data*/ ctx[1].byId("item", /*comp*/ ctx[15].id))) + "";

    	let t3;
    	let if_block = /*i*/ ctx[17] !== 0 && create_if_block$4(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			t0 = space();
    			t1 = text(t1_value);
    			t2 = space();
    			a = element("a");
    			t3 = text(t3_value);
    			attr_dev(a, "href", "#/item/" + /*comp*/ ctx[15].id);
    			add_location(a, file$5, 113, 23, 4708);
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, a, anchor);
    			append_dev(a, t3);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$data*/ 2 && t3_value !== (t3_value = (/*comp*/ ctx[15].count === 1
    			? singularName(/*$data*/ ctx[1].byId("item", /*comp*/ ctx[15].id))
    			: pluralName(/*$data*/ ctx[1].byId("item", /*comp*/ ctx[15].id))) + "")) set_data_dev(t3, t3_value);
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$2.name,
    		type: "each",
    		source: "(112:8) {#each componentChoices as comp, i}",
    		ctx
    	});

    	return block;
    }

    // (110:6) {#each components as componentChoices}
    function create_each_block$2(ctx) {
    	let li;
    	let t;
    	let each_value_1 = /*componentChoices*/ ctx[12];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$2(get_each_context_1$2(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			li = element("li");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			add_location(li, file$5, 110, 6, 4599);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(li, null);
    			}

    			append_dev(li, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*components, $data*/ 18) {
    				each_value_1 = /*componentChoices*/ ctx[12];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$2(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(li, t);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(110:6) {#each components as componentChoices}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let section;
    	let dl;
    	let dt0;
    	let dd0;
    	let a;
    	let t1_value = singularName(/*$data*/ ctx[1].byId("skill", /*recipe*/ ctx[0].skill_used)) + "";
    	let t1;
    	let a_href_value;
    	let t2;
    	let t3_value = (/*recipe*/ ctx[0].difficulty ?? 0) + "";
    	let t3;
    	let t4;
    	let if_block0_anchor;
    	let dt1;
    	let dd1;
    	let t6_value = /*recipe*/ ctx[0].time + "";
    	let t6;
    	let dt2;
    	let dd2;
    	let t8_value = (/*recipe*/ ctx[0].charges ?? /*result*/ ctx[2].initial_charges ?? /*result*/ ctx[2].count ?? /*result*/ ctx[2].charges) + "";
    	let t8;
    	let dt3;
    	let dd3;
    	let ul0;
    	let t10;
    	let t11;
    	let dt4;
    	let dd4;
    	let ul1;
    	let t13;
    	let details;
    	let summary;
    	let t15;
    	let pre;
    	let t16_value = JSON.stringify(/*recipe*/ ctx[0], null, 2) + "";
    	let t16;
    	let if_block0 = /*skillsRequired*/ ctx[6].length && create_if_block_6(ctx);
    	let if_block1 = /*recipe*/ ctx[0].proficiencies && create_if_block_5(ctx);
    	let each_value_4 = /*qualities*/ ctx[5] ?? [];
    	validate_each_argument(each_value_4);
    	let each_blocks_2 = [];

    	for (let i = 0; i < each_value_4.length; i += 1) {
    		each_blocks_2[i] = create_each_block_4$1(get_each_context_4$1(ctx, each_value_4, i));
    	}

    	let each_value_2 = /*tools*/ ctx[3];
    	validate_each_argument(each_value_2);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_1[i] = create_each_block_2$1(get_each_context_2$1(ctx, each_value_2, i));
    	}

    	let each_value = /*components*/ ctx[4];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			section = element("section");
    			dl = element("dl");
    			dt0 = element("dt");
    			dt0.textContent = "Primary skill";
    			dd0 = element("dd");
    			a = element("a");
    			t1 = text(t1_value);
    			t2 = text(" (");
    			t3 = text(t3_value);
    			t4 = text(")");
    			if (if_block0) if_block0.c();
    			if_block0_anchor = empty();
    			if (if_block1) if_block1.c();
    			dt1 = element("dt");
    			dt1.textContent = "Time to complete";
    			dd1 = element("dd");
    			t6 = text(t6_value);
    			dt2 = element("dt");
    			dt2.textContent = "Recipe makes";
    			dd2 = element("dd");
    			t8 = text(t8_value);
    			dt3 = element("dt");
    			dt3.textContent = "Tools required";
    			dd3 = element("dd");
    			ul0 = element("ul");

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t10 = space();

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t11 = space();
    			dt4 = element("dt");
    			dt4.textContent = "Components";
    			dd4 = element("dd");
    			ul1 = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t13 = space();
    			details = element("details");
    			summary = element("summary");
    			summary.textContent = "Recipe JSON";
    			t15 = space();
    			pre = element("pre");
    			t16 = text(t16_value);
    			add_location(dt0, file$5, 59, 2, 2695);
    			attr_dev(a, "href", a_href_value = "#/skill/" + /*recipe*/ ctx[0].skill_used);
    			add_location(a, file$5, 60, 6, 2724);
    			add_location(dd0, file$5, 60, 2, 2720);
    			add_location(dt1, file$5, 81, 2, 3439);
    			add_location(dd1, file$5, 82, 2, 3467);
    			add_location(dt2, file$5, 83, 2, 3492);
    			add_location(dd2, file$5, 84, 2, 3516);
    			add_location(dt3, file$5, 85, 2, 3649);
    			attr_dev(ul0, "class", "svelte-k9dy74");
    			add_location(ul0, file$5, 87, 4, 3684);
    			add_location(dd3, file$5, 86, 2, 3675);
    			add_location(dt4, file$5, 106, 2, 4512);
    			attr_dev(ul1, "class", "svelte-k9dy74");
    			add_location(ul1, file$5, 108, 4, 4543);
    			add_location(dd4, file$5, 107, 2, 4534);
    			add_location(dl, file$5, 58, 0, 2688);
    			add_location(summary, file$5, 121, 0, 4920);
    			add_location(pre, file$5, 122, 0, 4951);
    			add_location(details, file$5, 120, 0, 4910);
    			attr_dev(section, "class", "recipe");
    			add_location(section, file$5, 57, 0, 2663);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, dl);
    			append_dev(dl, dt0);
    			append_dev(dl, dd0);
    			append_dev(dd0, a);
    			append_dev(a, t1);
    			append_dev(dd0, t2);
    			append_dev(dd0, t3);
    			append_dev(dd0, t4);
    			if (if_block0) if_block0.m(dl, null);
    			append_dev(dl, if_block0_anchor);
    			if (if_block1) if_block1.m(dl, null);
    			append_dev(dl, dt1);
    			append_dev(dl, dd1);
    			append_dev(dd1, t6);
    			append_dev(dl, dt2);
    			append_dev(dl, dd2);
    			append_dev(dd2, t8);
    			append_dev(dl, dt3);
    			append_dev(dl, dd3);
    			append_dev(dd3, ul0);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].m(ul0, null);
    			}

    			append_dev(ul0, t10);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(ul0, null);
    			}

    			append_dev(dd3, t11);
    			append_dev(dl, dt4);
    			append_dev(dl, dd4);
    			append_dev(dd4, ul1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul1, null);
    			}

    			append_dev(section, t13);
    			append_dev(section, details);
    			append_dev(details, summary);
    			append_dev(details, t15);
    			append_dev(details, pre);
    			append_dev(pre, t16);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$data, recipe*/ 3 && t1_value !== (t1_value = singularName(/*$data*/ ctx[1].byId("skill", /*recipe*/ ctx[0].skill_used)) + "")) set_data_dev(t1, t1_value);

    			if (dirty[0] & /*recipe*/ 1 && a_href_value !== (a_href_value = "#/skill/" + /*recipe*/ ctx[0].skill_used)) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if (dirty[0] & /*recipe*/ 1 && t3_value !== (t3_value = (/*recipe*/ ctx[0].difficulty ?? 0) + "")) set_data_dev(t3, t3_value);
    			if (/*skillsRequired*/ ctx[6].length) if_block0.p(ctx, dirty);

    			if (/*recipe*/ ctx[0].proficiencies) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_5(ctx);
    					if_block1.c();
    					if_block1.m(dl, dt1);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (dirty[0] & /*recipe*/ 1 && t6_value !== (t6_value = /*recipe*/ ctx[0].time + "")) set_data_dev(t6, t6_value);
    			if (dirty[0] & /*recipe*/ 1 && t8_value !== (t8_value = (/*recipe*/ ctx[0].charges ?? /*result*/ ctx[2].initial_charges ?? /*result*/ ctx[2].count ?? /*result*/ ctx[2].charges) + "")) set_data_dev(t8, t8_value);

    			if (dirty[0] & /*qualities, $data*/ 34) {
    				each_value_4 = /*qualities*/ ctx[5] ?? [];
    				validate_each_argument(each_value_4);
    				let i;

    				for (i = 0; i < each_value_4.length; i += 1) {
    					const child_ctx = get_each_context_4$1(ctx, each_value_4, i);

    					if (each_blocks_2[i]) {
    						each_blocks_2[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_2[i] = create_each_block_4$1(child_ctx);
    						each_blocks_2[i].c();
    						each_blocks_2[i].m(ul0, t10);
    					}
    				}

    				for (; i < each_blocks_2.length; i += 1) {
    					each_blocks_2[i].d(1);
    				}

    				each_blocks_2.length = each_value_4.length;
    			}

    			if (dirty[0] & /*tools, $data*/ 10) {
    				each_value_2 = /*tools*/ ctx[3];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2$1(ctx, each_value_2, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_2$1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(ul0, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_2.length;
    			}

    			if (dirty[0] & /*components, $data*/ 18) {
    				each_value = /*components*/ ctx[4];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty[0] & /*recipe*/ 1 && t16_value !== (t16_value = JSON.stringify(/*recipe*/ ctx[0], null, 2) + "")) set_data_dev(t16, t16_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			destroy_each(each_blocks_2, detaching);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function normalizeSkillsRequired(skills_required) {
    	if (skills_required === undefined) return [];
    	if (Array.isArray(skills_required[0])) return skills_required;
    	return [skills_required];
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let $data;
    	validate_store(data, "data");
    	component_subscribe($$self, data, $$value => $$invalidate(1, $data = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Recipe", slots, []);
    	var _a;
    	let { recipe } = $$props;

    	function flattenChoices(choices, get) {
    		var _a;
    		const flatChoices = [];

    		for (const choice of choices) {
    			const [id, count, isList] = choice;

    			if (isList) {
    				const otherRequirement = $data.byId("requirement", id);

    				if (otherRequirement.type !== "requirement") {
    					console.error(`Expected a requirement, got ${otherRequirement.type} (id=${otherRequirement.id})`);
    				}

    				const otherRequirementTools = (_a = get(otherRequirement)) !== null && _a !== void 0
    				? _a
    				: [];

    				const otherRequirementChoices = otherRequirementTools[0]; // only take the first
    				flatChoices.push(...flattenChoices(otherRequirementChoices, get).map(x => Object.assign(Object.assign({}, x), { count: x.count * count })));
    			} else {
    				flatChoices.push({ id, count });
    			}
    		}

    		return flatChoices;
    	}

    	function expandSubstitutes(r) {
    		const replacements = $data.replacementTools(r.id);
    		return [r, ...replacements.map(o => ({ id: o, count: r.count }))];
    	}

    	function flattenRequirement(required, get) {
    		return required.map(x => flattenChoices(x, get)).map(x => x.flatMap(expandSubstitutes)).filter(x => x.length);
    	}

    	let result = $data.byId("item", recipe.result);
    	let requirements = ((_a = recipe.using) !== null && _a !== void 0 ? _a : []).map(([id, count]) => [$data.byId("requirement", id), count]).concat([[recipe, 1]]);

    	let tools = requirements.flatMap(([req, count]) => {
    		var _a;
    		return flattenRequirement((_a = req.tools) !== null && _a !== void 0 ? _a : [], x => x.tools).map(x => x.map(x => Object.assign(Object.assign({}, x), { count: x.count * count })));
    	});

    	let components = requirements.flatMap(([req, count]) => {
    		var _a;

    		return flattenRequirement(
    			(_a = req.components) !== null && _a !== void 0
    			? _a
    			: [],
    			x => x.components
    		).map(x => x.map(x => Object.assign(Object.assign({}, x), { count: x.count * count })));
    	});

    	let qualities = requirements.flatMap(([req, count]) => {
    		var _a;
    		return (_a = req.qualities) !== null && _a !== void 0 ? _a : [];
    	});

    	let skillsRequired = normalizeSkillsRequired(recipe.skills_required);
    	const writable_props = ["recipe"];

    	Object_1$2.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Recipe> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("recipe" in $$props) $$invalidate(0, recipe = $$props.recipe);
    	};

    	$$self.$capture_state = () => ({
    		_a,
    		data,
    		singularName,
    		pluralName,
    		recipe,
    		flattenChoices,
    		expandSubstitutes,
    		flattenRequirement,
    		result,
    		requirements,
    		tools,
    		components,
    		qualities,
    		normalizeSkillsRequired,
    		skillsRequired,
    		$data
    	});

    	$$self.$inject_state = $$props => {
    		if ("_a" in $$props) _a = $$props._a;
    		if ("recipe" in $$props) $$invalidate(0, recipe = $$props.recipe);
    		if ("result" in $$props) $$invalidate(2, result = $$props.result);
    		if ("requirements" in $$props) requirements = $$props.requirements;
    		if ("tools" in $$props) $$invalidate(3, tools = $$props.tools);
    		if ("components" in $$props) $$invalidate(4, components = $$props.components);
    		if ("qualities" in $$props) $$invalidate(5, qualities = $$props.qualities);
    		if ("skillsRequired" in $$props) $$invalidate(6, skillsRequired = $$props.skillsRequired);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [recipe, $data, result, tools, components, qualities, skillsRequired];
    }

    class Recipe extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { recipe: 0 }, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Recipe",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*recipe*/ ctx[0] === undefined && !("recipe" in props)) {
    			console_1.warn("<Recipe> was created without expected prop 'recipe'");
    		}
    	}

    	get recipe() {
    		throw new Error("<Recipe>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set recipe(value) {
    		throw new Error("<Recipe>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/types/Item.svelte generated by Svelte v3.34.0 */
    const file$4 = "src/types/Item.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[18] = list[i].quality;
    	child_ctx[19] = list[i].level;
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[22] = list[i];
    	return child_ctx;
    }

    function get_each_context_4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[25] = list[i];
    	return child_ctx;
    }

    // (49:32) {#each materials as m}
    function create_each_block_4(ctx) {
    	let li;
    	let a;
    	let t_value = /*m*/ ctx[25].name + "";
    	let t;

    	const block = {
    		c: function create() {
    			li = element("li");
    			a = element("a");
    			t = text(t_value);
    			attr_dev(a, "href", "#/material/" + /*m*/ ctx[25].id);
    			add_location(a, file$4, 48, 58, 2011);
    			add_location(li, file$4, 48, 54, 2007);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, a);
    			append_dev(a, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_4.name,
    		type: "each",
    		source: "(49:32) {#each materials as m}",
    		ctx
    	});

    	return block;
    }

    // (54:2) {#if ammo}
    function create_if_block_4(ctx) {
    	let dt;
    	let dd;
    	let a;
    	let t1_value = singularName(/*$data*/ ctx[1].byId("ammunition_type", /*ammo*/ ctx[6])) + "";
    	let t1;

    	const block = {
    		c: function create() {
    			dt = element("dt");
    			dt.textContent = "Ammo";
    			dd = element("dd");
    			a = element("a");
    			t1 = text(t1_value);
    			add_location(dt, file$4, 54, 2, 2213);
    			attr_dev(a, "href", "#/ammunition_type/" + /*ammo*/ ctx[6]);
    			add_location(a, file$4, 54, 19, 2230);
    			add_location(dd, file$4, 54, 15, 2226);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, dt, anchor);
    			insert_dev(target, dd, anchor);
    			append_dev(dd, a);
    			append_dev(a, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$data*/ 2 && t1_value !== (t1_value = singularName(/*$data*/ ctx[1].byId("ammunition_type", /*ammo*/ ctx[6])) + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(dt);
    			if (detaching) detach_dev(dd);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(54:2) {#if ammo}",
    		ctx
    	});

    	return block;
    }

    // (59:98) {:else}
    function create_else_block$3(ctx) {
    	let li;
    	let em;

    	const block = {
    		c: function create() {
    			li = element("li");
    			em = element("em");
    			em.textContent = "none";
    			add_location(em, file$4, 58, 109, 2467);
    			add_location(li, file$4, 58, 105, 2463);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, em);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(59:98) {:else}",
    		ctx
    	});

    	return block;
    }

    // (59:32) {#each flags as f}
    function create_each_block_3(ctx) {
    	let li;
    	let a;
    	let t_value = /*f*/ ctx[22].id + "";
    	let t;

    	const block = {
    		c: function create() {
    			li = element("li");
    			a = element("a");
    			t = text(t_value);
    			attr_dev(a, "href", "#/json_flag/" + /*f*/ ctx[22].id);
    			add_location(a, file$4, 58, 54, 2412);
    			add_location(li, file$4, 58, 50, 2408);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, a);
    			append_dev(a, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(59:32) {#each flags as f}",
    		ctx
    	});

    	return block;
    }

    // (62:2) {#if qualities.length}
    function create_if_block_3(ctx) {
    	let dt;
    	let dd;
    	let ul;
    	let each_value_2 = /*qualities*/ ctx[3];
    	validate_each_argument(each_value_2);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	const block = {
    		c: function create() {
    			dt = element("dt");
    			dt.textContent = "Qualities";
    			dd = element("dd");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(dt, file$4, 62, 2, 2534);
    			attr_dev(ul, "class", "no-bullets");
    			add_location(ul, file$4, 64, 2, 2562);
    			add_location(dd, file$4, 63, 2, 2555);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, dt, anchor);
    			insert_dev(target, dd, anchor);
    			append_dev(dd, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*qualities, singularName*/ 8) {
    				each_value_2 = /*qualities*/ ctx[3];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_2.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(dt);
    			if (detaching) detach_dev(dd);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(62:2) {#if qualities.length}",
    		ctx
    	});

    	return block;
    }

    // (66:2) {#each qualities as {quality, level}}
    function create_each_block_2(ctx) {
    	let li;
    	let t0;
    	let strong;
    	let t1_value = /*level*/ ctx[19] + "";
    	let t1;
    	let t2;
    	let a;
    	let t3_value = singularName(/*quality*/ ctx[18]) + "";
    	let t3;
    	let t4;

    	const block = {
    		c: function create() {
    			li = element("li");
    			t0 = text("Has level ");
    			strong = element("strong");
    			t1 = text(t1_value);
    			t2 = space();
    			a = element("a");
    			t3 = text(t3_value);
    			t4 = text(" quality.");
    			attr_dev(a, "href", "#/tool_quality/" + /*quality*/ ctx[18].id);
    			add_location(a, file$4, 66, 34, 2660);
    			add_location(strong, file$4, 66, 18, 2644);
    			add_location(li, file$4, 66, 4, 2630);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, t0);
    			append_dev(li, strong);
    			append_dev(strong, t1);
    			append_dev(strong, t2);
    			append_dev(strong, a);
    			append_dev(a, t3);
    			append_dev(li, t4);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(66:2) {#each qualities as {quality, level}}",
    		ctx
    	});

    	return block;
    }

    // (75:0) {#if item.bashing || item.cutting}
    function create_if_block_1$2(ctx) {
    	let section;
    	let h1;
    	let t1;
    	let dl;
    	let dt0;
    	let dd0;
    	let t3_value = (/*item*/ ctx[0].bashing ?? 0) + "";
    	let t3;
    	let dt1;
    	let dd1;
    	let t5_value = (/*item*/ ctx[0].cutting ?? 0) + "";
    	let t5;
    	let dt2;
    	let dd2;
    	let t7_value = (/*item*/ ctx[0].to_hit ?? 0) + "";
    	let t7;
    	let dt3;
    	let dd3;
    	let t9_value = attackTime(/*item*/ ctx[0]) + "";
    	let t9;
    	let if_block = /*techniques*/ ctx[2].length && create_if_block_2(ctx);

    	const block = {
    		c: function create() {
    			section = element("section");
    			h1 = element("h1");
    			h1.textContent = "Melee";
    			t1 = space();
    			dl = element("dl");
    			dt0 = element("dt");
    			dt0.textContent = "Bash";
    			dd0 = element("dd");
    			t3 = text(t3_value);
    			dt1 = element("dt");
    			dt1.textContent = "Cut";
    			dd1 = element("dd");
    			t5 = text(t5_value);
    			dt2 = element("dt");
    			dt2.textContent = "To hit";
    			dd2 = element("dd");
    			t7 = text(t7_value);
    			dt3 = element("dt");
    			dt3.textContent = "Moves per attack";
    			dd3 = element("dd");
    			t9 = text(t9_value);
    			if (if_block) if_block.c();
    			add_location(h1, file$4, 76, 0, 2909);
    			add_location(dt0, file$4, 78, 2, 2931);
    			add_location(dd0, file$4, 78, 15, 2944);
    			add_location(dt1, file$4, 79, 2, 2975);
    			add_location(dd1, file$4, 79, 14, 2987);
    			add_location(dt2, file$4, 80, 2, 3018);
    			add_location(dd2, file$4, 80, 17, 3033);
    			add_location(dt3, file$4, 81, 2, 3063);
    			add_location(dd3, file$4, 81, 27, 3088);
    			add_location(dl, file$4, 77, 0, 2924);
    			add_location(section, file$4, 75, 0, 2899);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, h1);
    			append_dev(section, t1);
    			append_dev(section, dl);
    			append_dev(dl, dt0);
    			append_dev(dl, dd0);
    			append_dev(dd0, t3);
    			append_dev(dl, dt1);
    			append_dev(dl, dd1);
    			append_dev(dd1, t5);
    			append_dev(dl, dt2);
    			append_dev(dl, dd2);
    			append_dev(dd2, t7);
    			append_dev(dl, dt3);
    			append_dev(dl, dd3);
    			append_dev(dd3, t9);
    			if (if_block) if_block.m(dl, null);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*item*/ 1 && t3_value !== (t3_value = (/*item*/ ctx[0].bashing ?? 0) + "")) set_data_dev(t3, t3_value);
    			if (dirty & /*item*/ 1 && t5_value !== (t5_value = (/*item*/ ctx[0].cutting ?? 0) + "")) set_data_dev(t5, t5_value);
    			if (dirty & /*item*/ 1 && t7_value !== (t7_value = (/*item*/ ctx[0].to_hit ?? 0) + "")) set_data_dev(t7, t7_value);
    			if (dirty & /*item*/ 1 && t9_value !== (t9_value = attackTime(/*item*/ ctx[0]) + "")) set_data_dev(t9, t9_value);
    			if (/*techniques*/ ctx[2].length) if_block.p(ctx, dirty);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(75:0) {#if item.bashing || item.cutting}",
    		ctx
    	});

    	return block;
    }

    // (83:0) {#if techniques.length}
    function create_if_block_2(ctx) {
    	let dt;
    	let dd;
    	let ul;
    	let each_value_1 = /*techniques*/ ctx[2];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			dt = element("dt");
    			dt.textContent = "Techniques";
    			dd = element("dd");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(dt, file$4, 83, 2, 3142);
    			attr_dev(ul, "class", "no-bullets");
    			add_location(ul, file$4, 83, 25, 3165);
    			add_location(dd, file$4, 83, 21, 3161);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, dt, anchor);
    			insert_dev(target, dd, anchor);
    			append_dev(dd, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*techniques*/ 4) {
    				each_value_1 = /*techniques*/ ctx[2];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(dt);
    			if (detaching) detach_dev(dd);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(83:0) {#if techniques.length}",
    		ctx
    	});

    	return block;
    }

    // (84:48) {#each techniques as technique}
    function create_each_block_1$1(ctx) {
    	let li;
    	let strong;
    	let a;
    	let t0_value = /*technique*/ ctx[15].name + "";
    	let t0;
    	let t1;
    	let t2_value = /*technique*/ ctx[15].description + "";
    	let t2;

    	const block = {
    		c: function create() {
    			li = element("li");
    			strong = element("strong");
    			a = element("a");
    			t0 = text(t0_value);
    			t1 = text(": ");
    			t2 = text(t2_value);
    			attr_dev(a, "href", "#/technique/" + /*technique*/ ctx[15].id);
    			add_location(a, file$4, 84, 14, 3234);
    			add_location(strong, file$4, 84, 6, 3226);
    			add_location(li, file$4, 84, 2, 3222);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, strong);
    			append_dev(strong, a);
    			append_dev(a, t0);
    			append_dev(li, t1);
    			append_dev(li, t2);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(84:48) {#each techniques as technique}",
    		ctx
    	});

    	return block;
    }

    // (92:0) {#if recipes.length}
    function create_if_block$3(ctx) {
    	let h2;
    	let t1;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_1_anchor;
    	let current;
    	let each_value = /*recipes*/ ctx[7];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*recipe*/ ctx[12];
    	validate_each_keys(ctx, each_value, get_each_context$1, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$1(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$1(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "Recipes";
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    			add_location(h2, file$4, 92, 0, 3404);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			insert_dev(target, t1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*recipes*/ 128) {
    				each_value = /*recipes*/ ctx[7];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context$1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, each_1_anchor.parentNode, outro_and_destroy_block, create_each_block$1, each_1_anchor, get_each_context$1);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(92:0) {#if recipes.length}",
    		ctx
    	});

    	return block;
    }

    // (94:0) {#each recipes as recipe (recipe)}
    function create_each_block$1(key_1, ctx) {
    	let first;
    	let recipe;
    	let current;

    	recipe = new Recipe({
    			props: { recipe: /*recipe*/ ctx[12] },
    			$$inline: true
    		});

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(recipe.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(recipe, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(recipe.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(recipe.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(recipe, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(94:0) {#each recipes as recipe (recipe)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let h10;
    	let span;
    	let t0_value = /*item*/ ctx[0].symbol + "";
    	let t0;
    	let span_class_value;
    	let t1;
    	let t2_value = singularName(/*item*/ ctx[0]) + "";
    	let t2;
    	let t3;
    	let section;
    	let h11;
    	let t5;
    	let dl;
    	let dt0;
    	let dd0;
    	let ul0;
    	let t7;
    	let dt1;
    	let dd1;
    	let t9_value = /*item*/ ctx[0].volume + "";
    	let t9;
    	let dt2;
    	let dd2;
    	let t11_value = /*item*/ ctx[0].weight + "";
    	let t11;
    	let dt3;
    	let dd3;
    	let t13_value = length(/*item*/ ctx[0]) + "";
    	let t13;
    	let dt4;
    	let dd4;
    	let ul1;
    	let t15;
    	let t16;
    	let p;
    	let t17_value = /*item*/ ctx[0].description + "";
    	let t17;
    	let t18;
    	let t19;
    	let if_block3_anchor;
    	let current;
    	let each_value_4 = /*materials*/ ctx[4];
    	validate_each_argument(each_value_4);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_4.length; i += 1) {
    		each_blocks_1[i] = create_each_block_4(get_each_context_4(ctx, each_value_4, i));
    	}

    	let if_block0 = /*ammo*/ ctx[6] && create_if_block_4(ctx);
    	let each_value_3 = /*flags*/ ctx[5];
    	validate_each_argument(each_value_3);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	let each1_else = null;

    	if (!each_value_3.length) {
    		each1_else = create_else_block$3(ctx);
    	}

    	let if_block1 = /*qualities*/ ctx[3].length && create_if_block_3(ctx);
    	let if_block2 = (/*item*/ ctx[0].bashing || /*item*/ ctx[0].cutting) && create_if_block_1$2(ctx);
    	let if_block3 = /*recipes*/ ctx[7].length && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			h10 = element("h1");
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			t2 = text(t2_value);
    			t3 = space();
    			section = element("section");
    			h11 = element("h1");
    			h11.textContent = "General";
    			t5 = space();
    			dl = element("dl");
    			dt0 = element("dt");
    			dt0.textContent = "Material";
    			dd0 = element("dd");
    			ul0 = element("ul");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t7 = space();
    			dt1 = element("dt");
    			dt1.textContent = "Volume";
    			dd1 = element("dd");
    			t9 = text(t9_value);
    			dt2 = element("dt");
    			dt2.textContent = "Weight";
    			dd2 = element("dd");
    			t11 = text(t11_value);
    			dt3 = element("dt");
    			dt3.textContent = "Length";
    			dd3 = element("dd");
    			t13 = text(t13_value);
    			if (if_block0) if_block0.c();
    			dt4 = element("dt");
    			dt4.textContent = "Flags";
    			dd4 = element("dd");
    			ul1 = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			if (each1_else) {
    				each1_else.c();
    			}

    			t15 = space();
    			if (if_block1) if_block1.c();
    			t16 = space();
    			p = element("p");
    			t17 = text(t17_value);
    			t18 = space();
    			if (if_block2) if_block2.c();
    			t19 = space();
    			if (if_block3) if_block3.c();
    			if_block3_anchor = empty();
    			set_style(span, "font-family", "monospace");
    			attr_dev(span, "class", span_class_value = "c_" + /*item*/ ctx[0].color);
    			add_location(span, file$4, 42, 4, 1786);
    			add_location(h10, file$4, 42, 0, 1782);
    			add_location(h11, file$4, 44, 0, 1904);
    			add_location(dt0, file$4, 46, 2, 1928);
    			attr_dev(ul0, "class", "comma-separated");
    			add_location(ul0, file$4, 48, 4, 1957);
    			add_location(dd0, file$4, 47, 2, 1948);
    			add_location(dt1, file$4, 50, 2, 2079);
    			add_location(dd1, file$4, 50, 17, 2094);
    			add_location(dt2, file$4, 51, 2, 2119);
    			add_location(dd2, file$4, 51, 17, 2134);
    			add_location(dt3, file$4, 52, 2, 2159);
    			add_location(dd3, file$4, 52, 17, 2174);
    			add_location(dt4, file$4, 56, 2, 2336);
    			attr_dev(ul1, "class", "comma-separated");
    			add_location(ul1, file$4, 58, 4, 2362);
    			add_location(dd4, file$4, 57, 2, 2353);
    			add_location(dl, file$4, 45, 0, 1921);
    			set_style(p, "color", "var(--cata-color-gray)");
    			add_location(p, file$4, 72, 0, 2789);
    			add_location(section, file$4, 43, 0, 1894);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h10, anchor);
    			append_dev(h10, span);
    			append_dev(span, t0);
    			append_dev(h10, t1);
    			append_dev(h10, t2);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, section, anchor);
    			append_dev(section, h11);
    			append_dev(section, t5);
    			append_dev(section, dl);
    			append_dev(dl, dt0);
    			append_dev(dl, dd0);
    			append_dev(dd0, ul0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(ul0, null);
    			}

    			append_dev(dd0, t7);
    			append_dev(dl, dt1);
    			append_dev(dl, dd1);
    			append_dev(dd1, t9);
    			append_dev(dl, dt2);
    			append_dev(dl, dd2);
    			append_dev(dd2, t11);
    			append_dev(dl, dt3);
    			append_dev(dl, dd3);
    			append_dev(dd3, t13);
    			if (if_block0) if_block0.m(dl, null);
    			append_dev(dl, dt4);
    			append_dev(dl, dd4);
    			append_dev(dd4, ul1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul1, null);
    			}

    			if (each1_else) {
    				each1_else.m(ul1, null);
    			}

    			append_dev(dd4, t15);
    			if (if_block1) if_block1.m(dl, null);
    			append_dev(section, t16);
    			append_dev(section, p);
    			append_dev(p, t17);
    			insert_dev(target, t18, anchor);
    			if (if_block2) if_block2.m(target, anchor);
    			insert_dev(target, t19, anchor);
    			if (if_block3) if_block3.m(target, anchor);
    			insert_dev(target, if_block3_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*item*/ 1) && t0_value !== (t0_value = /*item*/ ctx[0].symbol + "")) set_data_dev(t0, t0_value);

    			if (!current || dirty & /*item*/ 1 && span_class_value !== (span_class_value = "c_" + /*item*/ ctx[0].color)) {
    				attr_dev(span, "class", span_class_value);
    			}

    			if ((!current || dirty & /*item*/ 1) && t2_value !== (t2_value = singularName(/*item*/ ctx[0]) + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*materials*/ 16) {
    				each_value_4 = /*materials*/ ctx[4];
    				validate_each_argument(each_value_4);
    				let i;

    				for (i = 0; i < each_value_4.length; i += 1) {
    					const child_ctx = get_each_context_4(ctx, each_value_4, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_4(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(ul0, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_4.length;
    			}

    			if ((!current || dirty & /*item*/ 1) && t9_value !== (t9_value = /*item*/ ctx[0].volume + "")) set_data_dev(t9, t9_value);
    			if ((!current || dirty & /*item*/ 1) && t11_value !== (t11_value = /*item*/ ctx[0].weight + "")) set_data_dev(t11, t11_value);
    			if ((!current || dirty & /*item*/ 1) && t13_value !== (t13_value = length(/*item*/ ctx[0]) + "")) set_data_dev(t13, t13_value);
    			if (/*ammo*/ ctx[6]) if_block0.p(ctx, dirty);

    			if (dirty & /*flags*/ 32) {
    				each_value_3 = /*flags*/ ctx[5];
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_3.length;

    				if (each_value_3.length) {
    					if (each1_else) {
    						each1_else.d(1);
    						each1_else = null;
    					}
    				} else if (!each1_else) {
    					each1_else = create_else_block$3(ctx);
    					each1_else.c();
    					each1_else.m(ul1, null);
    				}
    			}

    			if (/*qualities*/ ctx[3].length) if_block1.p(ctx, dirty);
    			if ((!current || dirty & /*item*/ 1) && t17_value !== (t17_value = /*item*/ ctx[0].description + "")) set_data_dev(t17, t17_value);

    			if (/*item*/ ctx[0].bashing || /*item*/ ctx[0].cutting) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block_1$2(ctx);
    					if_block2.c();
    					if_block2.m(t19.parentNode, t19);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (/*recipes*/ ctx[7].length) if_block3.p(ctx, dirty);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block3);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block3);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h10);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(section);
    			destroy_each(each_blocks_1, detaching);
    			if (if_block0) if_block0.d();
    			destroy_each(each_blocks, detaching);
    			if (each1_else) each1_else.d();
    			if (if_block1) if_block1.d();
    			if (detaching) detach_dev(t18);
    			if (if_block2) if_block2.d(detaching);
    			if (detaching) detach_dev(t19);
    			if (if_block3) if_block3.d(detaching);
    			if (detaching) detach_dev(if_block3_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function parseVolume(string) {
    	if (typeof string === "undefined") return 0;
    	if (typeof string === "number") return string * 250;
    	if (string.endsWith("ml")) return parseInt(string); else if (string.endsWith("L")) return parseInt(string) * 1000;
    }

    function parseMass(string) {
    	if (typeof string === "undefined") return 0;
    	if (typeof string === "number") return string;
    	if (string.endsWith("g")) return parseInt(string);
    	if (string.endsWith("mg")) return parseInt(string) / 1000;
    	if (string.endsWith("kg")) return parseInt(string) * 1000;
    }

    function length(item) {
    	if (item.longest_side) return item.longest_side;
    	return `${Math.round(Math.cbrt(parseVolume(item.volume)))} cm`;
    }

    function attackTime(item) {
    	return Math.floor(65 + (parseVolume(item.volume) / 62.5 + parseMass(item.weight) / 60));
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $data;
    	validate_store(data, "data");
    	component_subscribe($$self, data, $$value => $$invalidate(1, $data = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Item", slots, []);
    	var _a, _b, _c, _d;
    	let { item } = $$props;

    	let techniques = ((_a = item.techniques) !== null && _a !== void 0
    	? _a
    	: []).map(t => $data.byId("technique", t));

    	let qualities = ((_b = item.qualities) !== null && _b !== void 0
    	? _b
    	: []).map(([id, level]) => ({
    		quality: $data.byId("tool_quality", id),
    		level
    	}));

    	let materials = ((_c = item.material) !== null && _c !== void 0 ? _c : []).map(id => $data.byId("material", id));

    	let flags = ((_d = item.flags) !== null && _d !== void 0 ? _d : []).map(id => {
    		var _a;

    		return (_a = $data.byId("json_flag", id)) !== null && _a !== void 0
    		? _a
    		: { id };
    	});

    	let ammo = Array.isArray(item.ammo) ? item.ammo[0] : item.ammo;
    	let recipes = $data.byType("recipe").filter(x => x.result === item.id && !x.obsolete);
    	const writable_props = ["item"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Item> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("item" in $$props) $$invalidate(0, item = $$props.item);
    	};

    	$$self.$capture_state = () => ({
    		_a,
    		_b,
    		_c,
    		_d,
    		data,
    		singularName,
    		Recipe,
    		item,
    		parseVolume,
    		parseMass,
    		length,
    		attackTime,
    		techniques,
    		qualities,
    		materials,
    		flags,
    		ammo,
    		recipes,
    		$data
    	});

    	$$self.$inject_state = $$props => {
    		if ("_a" in $$props) _a = $$props._a;
    		if ("_b" in $$props) _b = $$props._b;
    		if ("_c" in $$props) _c = $$props._c;
    		if ("_d" in $$props) _d = $$props._d;
    		if ("item" in $$props) $$invalidate(0, item = $$props.item);
    		if ("techniques" in $$props) $$invalidate(2, techniques = $$props.techniques);
    		if ("qualities" in $$props) $$invalidate(3, qualities = $$props.qualities);
    		if ("materials" in $$props) $$invalidate(4, materials = $$props.materials);
    		if ("flags" in $$props) $$invalidate(5, flags = $$props.flags);
    		if ("ammo" in $$props) $$invalidate(6, ammo = $$props.ammo);
    		if ("recipes" in $$props) $$invalidate(7, recipes = $$props.recipes);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [item, $data, techniques, qualities, materials, flags, ammo, recipes];
    }

    class Item extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { item: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Item",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*item*/ ctx[0] === undefined && !("item" in props)) {
    			console.warn("<Item> was created without expected prop 'item'");
    		}
    	}

    	get item() {
    		throw new Error("<Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set item(value) {
    		throw new Error("<Item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/types/Unknown.svelte generated by Svelte v3.34.0 */

    const file$3 = "src/types/Unknown.svelte";

    function create_fragment$3(ctx) {
    	let pre;
    	let t_value = JSON.stringify(/*item*/ ctx[0], null, 2) + "";
    	let t;

    	const block = {
    		c: function create() {
    			pre = element("pre");
    			t = text(t_value);
    			add_location(pre, file$3, 3, 0, 46);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, pre, anchor);
    			append_dev(pre, t);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*item*/ 1 && t_value !== (t_value = JSON.stringify(/*item*/ ctx[0], null, 2) + "")) set_data_dev(t, t_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(pre);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Unknown", slots, []);
    	let { item } = $$props;
    	const writable_props = ["item"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Unknown> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("item" in $$props) $$invalidate(0, item = $$props.item);
    	};

    	$$self.$capture_state = () => ({ item });

    	$$self.$inject_state = $$props => {
    		if ("item" in $$props) $$invalidate(0, item = $$props.item);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [item];
    }

    class Unknown extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { item: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Unknown",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*item*/ ctx[0] === undefined && !("item" in props)) {
    			console.warn("<Unknown> was created without expected prop 'item'");
    		}
    	}

    	get item() {
    		throw new Error("<Unknown>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set item(value) {
    		throw new Error("<Unknown>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Object.svelte generated by Svelte v3.34.0 */

    const { Object: Object_1$1 } = globals;
    const file$2 = "src/Object.svelte";

    // (34:0) {:else}
    function create_else_block$2(ctx) {
    	let switch_instance;
    	let t0;
    	let details;
    	let summary;
    	let t2;
    	let pre;
    	let t3_value = JSON.stringify(/*obj*/ ctx[2], null, 2) + "";
    	let t3;
    	let current;
    	var switch_value = /*displays*/ ctx[3][/*obj*/ ctx[2].type] ?? Unknown;

    	function switch_props(ctx) {
    		return {
    			props: { item: /*obj*/ ctx[2] },
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props(ctx));
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			t0 = space();
    			details = element("details");
    			summary = element("summary");
    			summary.textContent = "Raw JSON";
    			t2 = space();
    			pre = element("pre");
    			t3 = text(t3_value);
    			add_location(summary, file$2, 37, 0, 806);
    			add_location(pre, file$2, 38, 0, 834);
    			add_location(details, file$2, 36, 0, 796);
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, t0, anchor);
    			insert_dev(target, details, anchor);
    			append_dev(details, summary);
    			append_dev(details, t2);
    			append_dev(details, pre);
    			append_dev(pre, t3);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = {};
    			if (dirty & /*obj*/ 4) switch_instance_changes.item = /*obj*/ ctx[2];

    			if (switch_value !== (switch_value = /*displays*/ ctx[3][/*obj*/ ctx[2].type] ?? Unknown)) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, t0.parentNode, t0);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}

    			if ((!current || dirty & /*obj*/ 4) && t3_value !== (t3_value = JSON.stringify(/*obj*/ ctx[2], null, 2) + "")) set_data_dev(t3, t3_value);
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (switch_instance) destroy_component(switch_instance, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(details);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(34:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (32:0) {#if !obj}
    function create_if_block_1$1(ctx) {
    	let t0;
    	let t1_value = /*item*/ ctx[0].type + "";
    	let t1;
    	let t2;
    	let t3_value = /*item*/ ctx[0].id + "";
    	let t3;

    	const block = {
    		c: function create() {
    			t0 = text("Unknown obj: ");
    			t1 = text(t1_value);
    			t2 = text("/");
    			t3 = text(t3_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, t3, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*item*/ 1 && t1_value !== (t1_value = /*item*/ ctx[0].type + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*item*/ 1 && t3_value !== (t3_value = /*item*/ ctx[0].id + "")) set_data_dev(t3, t3_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(t3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(32:0) {#if !obj}",
    		ctx
    	});

    	return block;
    }

    // (29:0) {#if !$data}
    function create_if_block$2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("...");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(29:0) {#if !$data}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$2, create_if_block_1$1, create_else_block$2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (!/*$data*/ ctx[1]) return 0;
    		if (!/*obj*/ ctx[2]) return 1;
    		return 2;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $data;
    	validate_store(data, "data");
    	component_subscribe($$self, data, $$value => $$invalidate(1, $data = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Object", slots, []);
    	let { item } = $$props;
    	let obj;

    	const displays = {
    		MONSTER: Monster,
    		AMMO: Item,
    		GUN: Item,
    		ARMOR: Item,
    		PET_ARMOR: Item,
    		TOOL: Item,
    		TOOLMOD: Item,
    		TOOL_ARMOR: Item,
    		BOOK: Item,
    		COMESTIBLE: Item,
    		ENGINE: Item,
    		WHEEL: Item,
    		GUNMOD: Item,
    		MAGAZINE: Item,
    		BATTERY: Item,
    		GENERIC: Item,
    		BIONIC_ITEM: Item
    	};

    	const writable_props = ["item"];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Object> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("item" in $$props) $$invalidate(0, item = $$props.item);
    	};

    	$$self.$capture_state = () => ({
    		data,
    		Monster,
    		Item,
    		Unknown,
    		item,
    		obj,
    		displays,
    		$data
    	});

    	$$self.$inject_state = $$props => {
    		if ("item" in $$props) $$invalidate(0, item = $$props.item);
    		if ("obj" in $$props) $$invalidate(2, obj = $$props.obj);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$data, item*/ 3) {
    			$$invalidate(2, obj = $data === null || $data === void 0
    			? void 0
    			: $data.byId(item.type, item.id));
    		}
    	};

    	return [item, $data, obj, displays];
    }

    class Object$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { item: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Object",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*item*/ ctx[0] === undefined && !("item" in props)) {
    			console.warn("<Object> was created without expected prop 'item'");
    		}
    	}

    	get item() {
    		throw new Error("<Object>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set item(value) {
    		throw new Error("<Object>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /**
     * Fuse.js v6.4.6 - Lightweight fuzzy-search (http://fusejs.io)
     *
     * Copyright (c) 2021 Kiro Risk (http://kiro.me)
     * All Rights Reserved. Apache Software License 2.0
     *
     * http://www.apache.org/licenses/LICENSE-2.0
     */

    function isArray(value) {
      return !Array.isArray
        ? getTag(value) === '[object Array]'
        : Array.isArray(value)
    }

    // Adapted from: https://github.com/lodash/lodash/blob/master/.internal/baseToString.js
    const INFINITY = 1 / 0;
    function baseToString(value) {
      // Exit early for strings to avoid a performance hit in some environments.
      if (typeof value == 'string') {
        return value
      }
      let result = value + '';
      return result == '0' && 1 / value == -INFINITY ? '-0' : result
    }

    function toString(value) {
      return value == null ? '' : baseToString(value)
    }

    function isString(value) {
      return typeof value === 'string'
    }

    function isNumber(value) {
      return typeof value === 'number'
    }

    // Adapted from: https://github.com/lodash/lodash/blob/master/isBoolean.js
    function isBoolean(value) {
      return (
        value === true ||
        value === false ||
        (isObjectLike(value) && getTag(value) == '[object Boolean]')
      )
    }

    function isObject(value) {
      return typeof value === 'object'
    }

    // Checks if `value` is object-like.
    function isObjectLike(value) {
      return isObject(value) && value !== null
    }

    function isDefined(value) {
      return value !== undefined && value !== null
    }

    function isBlank(value) {
      return !value.trim().length
    }

    // Gets the `toStringTag` of `value`.
    // Adapted from: https://github.com/lodash/lodash/blob/master/.internal/getTag.js
    function getTag(value) {
      return value == null
        ? value === undefined
          ? '[object Undefined]'
          : '[object Null]'
        : Object.prototype.toString.call(value)
    }

    const EXTENDED_SEARCH_UNAVAILABLE = 'Extended search is not available';

    const INCORRECT_INDEX_TYPE = "Incorrect 'index' type";

    const LOGICAL_SEARCH_INVALID_QUERY_FOR_KEY = (key) =>
      `Invalid value for key ${key}`;

    const PATTERN_LENGTH_TOO_LARGE = (max) =>
      `Pattern length exceeds max of ${max}.`;

    const MISSING_KEY_PROPERTY = (name) => `Missing ${name} property in key`;

    const INVALID_KEY_WEIGHT_VALUE = (key) =>
      `Property 'weight' in key '${key}' must be a positive integer`;

    const hasOwn = Object.prototype.hasOwnProperty;

    class KeyStore {
      constructor(keys) {
        this._keys = [];
        this._keyMap = {};

        let totalWeight = 0;

        keys.forEach((key) => {
          let obj = createKey(key);

          totalWeight += obj.weight;

          this._keys.push(obj);
          this._keyMap[obj.id] = obj;

          totalWeight += obj.weight;
        });

        // Normalize weights so that their sum is equal to 1
        this._keys.forEach((key) => {
          key.weight /= totalWeight;
        });
      }
      get(keyId) {
        return this._keyMap[keyId]
      }
      keys() {
        return this._keys
      }
      toJSON() {
        return JSON.stringify(this._keys)
      }
    }

    function createKey(key) {
      let path = null;
      let id = null;
      let src = null;
      let weight = 1;

      if (isString(key) || isArray(key)) {
        src = key;
        path = createKeyPath(key);
        id = createKeyId(key);
      } else {
        if (!hasOwn.call(key, 'name')) {
          throw new Error(MISSING_KEY_PROPERTY('name'))
        }

        const name = key.name;
        src = name;

        if (hasOwn.call(key, 'weight')) {
          weight = key.weight;

          if (weight <= 0) {
            throw new Error(INVALID_KEY_WEIGHT_VALUE(name))
          }
        }

        path = createKeyPath(name);
        id = createKeyId(name);
      }

      return { path, id, weight, src }
    }

    function createKeyPath(key) {
      return isArray(key) ? key : key.split('.')
    }

    function createKeyId(key) {
      return isArray(key) ? key.join('.') : key
    }

    function get(obj, path) {
      let list = [];
      let arr = false;

      const deepGet = (obj, path, index) => {
        if (!isDefined(obj)) {
          return
        }
        if (!path[index]) {
          // If there's no path left, we've arrived at the object we care about.
          list.push(obj);
        } else {
          let key = path[index];

          const value = obj[key];

          if (!isDefined(value)) {
            return
          }

          // If we're at the last value in the path, and if it's a string/number/bool,
          // add it to the list
          if (
            index === path.length - 1 &&
            (isString(value) || isNumber(value) || isBoolean(value))
          ) {
            list.push(toString(value));
          } else if (isArray(value)) {
            arr = true;
            // Search each item in the array.
            for (let i = 0, len = value.length; i < len; i += 1) {
              deepGet(value[i], path, index + 1);
            }
          } else if (path.length) {
            // An object. Recurse further.
            deepGet(value, path, index + 1);
          }
        }
      };

      // Backwards compatibility (since path used to be a string)
      deepGet(obj, isString(path) ? path.split('.') : path, 0);

      return arr ? list : list[0]
    }

    const MatchOptions = {
      // Whether the matches should be included in the result set. When `true`, each record in the result
      // set will include the indices of the matched characters.
      // These can consequently be used for highlighting purposes.
      includeMatches: false,
      // When `true`, the matching function will continue to the end of a search pattern even if
      // a perfect match has already been located in the string.
      findAllMatches: false,
      // Minimum number of characters that must be matched before a result is considered a match
      minMatchCharLength: 1
    };

    const BasicOptions = {
      // When `true`, the algorithm continues searching to the end of the input even if a perfect
      // match is found before the end of the same input.
      isCaseSensitive: false,
      // When true, the matching function will continue to the end of a search pattern even if
      includeScore: false,
      // List of properties that will be searched. This also supports nested properties.
      keys: [],
      // Whether to sort the result list, by score
      shouldSort: true,
      // Default sort function: sort by ascending score, ascending index
      sortFn: (a, b) =>
        a.score === b.score ? (a.idx < b.idx ? -1 : 1) : a.score < b.score ? -1 : 1
    };

    const FuzzyOptions = {
      // Approximately where in the text is the pattern expected to be found?
      location: 0,
      // At what point does the match algorithm give up. A threshold of '0.0' requires a perfect match
      // (of both letters and location), a threshold of '1.0' would match anything.
      threshold: 0.6,
      // Determines how close the match must be to the fuzzy location (specified above).
      // An exact letter match which is 'distance' characters away from the fuzzy location
      // would score as a complete mismatch. A distance of '0' requires the match be at
      // the exact location specified, a threshold of '1000' would require a perfect match
      // to be within 800 characters of the fuzzy location to be found using a 0.8 threshold.
      distance: 100
    };

    const AdvancedOptions = {
      // When `true`, it enables the use of unix-like search commands
      useExtendedSearch: false,
      // The get function to use when fetching an object's properties.
      // The default will search nested paths *ie foo.bar.baz*
      getFn: get,
      // When `true`, search will ignore `location` and `distance`, so it won't matter
      // where in the string the pattern appears.
      // More info: https://fusejs.io/concepts/scoring-theory.html#fuzziness-score
      ignoreLocation: false,
      // When `true`, the calculation for the relevance score (used for sorting) will
      // ignore the field-length norm.
      // More info: https://fusejs.io/concepts/scoring-theory.html#field-length-norm
      ignoreFieldNorm: false
    };

    var Config = {
      ...BasicOptions,
      ...MatchOptions,
      ...FuzzyOptions,
      ...AdvancedOptions
    };

    const SPACE = /[^ ]+/g;

    // Field-length norm: the shorter the field, the higher the weight.
    // Set to 3 decimals to reduce index size.
    function norm(mantissa = 3) {
      const cache = new Map();
      const m = Math.pow(10, mantissa);

      return {
        get(value) {
          const numTokens = value.match(SPACE).length;

          if (cache.has(numTokens)) {
            return cache.get(numTokens)
          }

          const norm = 1 / Math.sqrt(numTokens);

          // In place of `toFixed(mantissa)`, for faster computation
          const n = parseFloat(Math.round(norm * m) / m);

          cache.set(numTokens, n);

          return n
        },
        clear() {
          cache.clear();
        }
      }
    }

    class FuseIndex {
      constructor({ getFn = Config.getFn } = {}) {
        this.norm = norm(3);
        this.getFn = getFn;
        this.isCreated = false;

        this.setIndexRecords();
      }
      setSources(docs = []) {
        this.docs = docs;
      }
      setIndexRecords(records = []) {
        this.records = records;
      }
      setKeys(keys = []) {
        this.keys = keys;
        this._keysMap = {};
        keys.forEach((key, idx) => {
          this._keysMap[key.id] = idx;
        });
      }
      create() {
        if (this.isCreated || !this.docs.length) {
          return
        }

        this.isCreated = true;

        // List is Array<String>
        if (isString(this.docs[0])) {
          this.docs.forEach((doc, docIndex) => {
            this._addString(doc, docIndex);
          });
        } else {
          // List is Array<Object>
          this.docs.forEach((doc, docIndex) => {
            this._addObject(doc, docIndex);
          });
        }

        this.norm.clear();
      }
      // Adds a doc to the end of the index
      add(doc) {
        const idx = this.size();

        if (isString(doc)) {
          this._addString(doc, idx);
        } else {
          this._addObject(doc, idx);
        }
      }
      // Removes the doc at the specified index of the index
      removeAt(idx) {
        this.records.splice(idx, 1);

        // Change ref index of every subsquent doc
        for (let i = idx, len = this.size(); i < len; i += 1) {
          this.records[i].i -= 1;
        }
      }
      getValueForItemAtKeyId(item, keyId) {
        return item[this._keysMap[keyId]]
      }
      size() {
        return this.records.length
      }
      _addString(doc, docIndex) {
        if (!isDefined(doc) || isBlank(doc)) {
          return
        }

        let record = {
          v: doc,
          i: docIndex,
          n: this.norm.get(doc)
        };

        this.records.push(record);
      }
      _addObject(doc, docIndex) {
        let record = { i: docIndex, $: {} };

        // Iterate over every key (i.e, path), and fetch the value at that key
        this.keys.forEach((key, keyIndex) => {
          // console.log(key)
          let value = this.getFn(doc, key.path);

          if (!isDefined(value)) {
            return
          }

          if (isArray(value)) {
            let subRecords = [];
            const stack = [{ nestedArrIndex: -1, value }];

            while (stack.length) {
              const { nestedArrIndex, value } = stack.pop();

              if (!isDefined(value)) {
                continue
              }

              if (isString(value) && !isBlank(value)) {
                let subRecord = {
                  v: value,
                  i: nestedArrIndex,
                  n: this.norm.get(value)
                };

                subRecords.push(subRecord);
              } else if (isArray(value)) {
                value.forEach((item, k) => {
                  stack.push({
                    nestedArrIndex: k,
                    value: item
                  });
                });
              }
            }
            record.$[keyIndex] = subRecords;
          } else if (!isBlank(value)) {
            let subRecord = {
              v: value,
              n: this.norm.get(value)
            };

            record.$[keyIndex] = subRecord;
          }
        });

        this.records.push(record);
      }
      toJSON() {
        return {
          keys: this.keys,
          records: this.records
        }
      }
    }

    function createIndex(keys, docs, { getFn = Config.getFn } = {}) {
      const myIndex = new FuseIndex({ getFn });
      myIndex.setKeys(keys.map(createKey));
      myIndex.setSources(docs);
      myIndex.create();
      return myIndex
    }

    function parseIndex(data, { getFn = Config.getFn } = {}) {
      const { keys, records } = data;
      const myIndex = new FuseIndex({ getFn });
      myIndex.setKeys(keys);
      myIndex.setIndexRecords(records);
      return myIndex
    }

    function computeScore(
      pattern,
      {
        errors = 0,
        currentLocation = 0,
        expectedLocation = 0,
        distance = Config.distance,
        ignoreLocation = Config.ignoreLocation
      } = {}
    ) {
      const accuracy = errors / pattern.length;

      if (ignoreLocation) {
        return accuracy
      }

      const proximity = Math.abs(expectedLocation - currentLocation);

      if (!distance) {
        // Dodge divide by zero error.
        return proximity ? 1.0 : accuracy
      }

      return accuracy + proximity / distance
    }

    function convertMaskToIndices(
      matchmask = [],
      minMatchCharLength = Config.minMatchCharLength
    ) {
      let indices = [];
      let start = -1;
      let end = -1;
      let i = 0;

      for (let len = matchmask.length; i < len; i += 1) {
        let match = matchmask[i];
        if (match && start === -1) {
          start = i;
        } else if (!match && start !== -1) {
          end = i - 1;
          if (end - start + 1 >= minMatchCharLength) {
            indices.push([start, end]);
          }
          start = -1;
        }
      }

      // (i-1 - start) + 1 => i - start
      if (matchmask[i - 1] && i - start >= minMatchCharLength) {
        indices.push([start, i - 1]);
      }

      return indices
    }

    // Machine word size
    const MAX_BITS = 32;

    function search(
      text,
      pattern,
      patternAlphabet,
      {
        location = Config.location,
        distance = Config.distance,
        threshold = Config.threshold,
        findAllMatches = Config.findAllMatches,
        minMatchCharLength = Config.minMatchCharLength,
        includeMatches = Config.includeMatches,
        ignoreLocation = Config.ignoreLocation
      } = {}
    ) {
      if (pattern.length > MAX_BITS) {
        throw new Error(PATTERN_LENGTH_TOO_LARGE(MAX_BITS))
      }

      const patternLen = pattern.length;
      // Set starting location at beginning text and initialize the alphabet.
      const textLen = text.length;
      // Handle the case when location > text.length
      const expectedLocation = Math.max(0, Math.min(location, textLen));
      // Highest score beyond which we give up.
      let currentThreshold = threshold;
      // Is there a nearby exact match? (speedup)
      let bestLocation = expectedLocation;

      // Performance: only computer matches when the minMatchCharLength > 1
      // OR if `includeMatches` is true.
      const computeMatches = minMatchCharLength > 1 || includeMatches;
      // A mask of the matches, used for building the indices
      const matchMask = computeMatches ? Array(textLen) : [];

      let index;

      // Get all exact matches, here for speed up
      while ((index = text.indexOf(pattern, bestLocation)) > -1) {
        let score = computeScore(pattern, {
          currentLocation: index,
          expectedLocation,
          distance,
          ignoreLocation
        });

        currentThreshold = Math.min(score, currentThreshold);
        bestLocation = index + patternLen;

        if (computeMatches) {
          let i = 0;
          while (i < patternLen) {
            matchMask[index + i] = 1;
            i += 1;
          }
        }
      }

      // Reset the best location
      bestLocation = -1;

      let lastBitArr = [];
      let finalScore = 1;
      let binMax = patternLen + textLen;

      const mask = 1 << (patternLen - 1);

      for (let i = 0; i < patternLen; i += 1) {
        // Scan for the best match; each iteration allows for one more error.
        // Run a binary search to determine how far from the match location we can stray
        // at this error level.
        let binMin = 0;
        let binMid = binMax;

        while (binMin < binMid) {
          const score = computeScore(pattern, {
            errors: i,
            currentLocation: expectedLocation + binMid,
            expectedLocation,
            distance,
            ignoreLocation
          });

          if (score <= currentThreshold) {
            binMin = binMid;
          } else {
            binMax = binMid;
          }

          binMid = Math.floor((binMax - binMin) / 2 + binMin);
        }

        // Use the result from this iteration as the maximum for the next.
        binMax = binMid;

        let start = Math.max(1, expectedLocation - binMid + 1);
        let finish = findAllMatches
          ? textLen
          : Math.min(expectedLocation + binMid, textLen) + patternLen;

        // Initialize the bit array
        let bitArr = Array(finish + 2);

        bitArr[finish + 1] = (1 << i) - 1;

        for (let j = finish; j >= start; j -= 1) {
          let currentLocation = j - 1;
          let charMatch = patternAlphabet[text.charAt(currentLocation)];

          if (computeMatches) {
            // Speed up: quick bool to int conversion (i.e, `charMatch ? 1 : 0`)
            matchMask[currentLocation] = +!!charMatch;
          }

          // First pass: exact match
          bitArr[j] = ((bitArr[j + 1] << 1) | 1) & charMatch;

          // Subsequent passes: fuzzy match
          if (i) {
            bitArr[j] |=
              ((lastBitArr[j + 1] | lastBitArr[j]) << 1) | 1 | lastBitArr[j + 1];
          }

          if (bitArr[j] & mask) {
            finalScore = computeScore(pattern, {
              errors: i,
              currentLocation,
              expectedLocation,
              distance,
              ignoreLocation
            });

            // This match will almost certainly be better than any existing match.
            // But check anyway.
            if (finalScore <= currentThreshold) {
              // Indeed it is
              currentThreshold = finalScore;
              bestLocation = currentLocation;

              // Already passed `loc`, downhill from here on in.
              if (bestLocation <= expectedLocation) {
                break
              }

              // When passing `bestLocation`, don't exceed our current distance from `expectedLocation`.
              start = Math.max(1, 2 * expectedLocation - bestLocation);
            }
          }
        }

        // No hope for a (better) match at greater error levels.
        const score = computeScore(pattern, {
          errors: i + 1,
          currentLocation: expectedLocation,
          expectedLocation,
          distance,
          ignoreLocation
        });

        if (score > currentThreshold) {
          break
        }

        lastBitArr = bitArr;
      }

      const result = {
        isMatch: bestLocation >= 0,
        // Count exact matches (those with a score of 0) to be "almost" exact
        score: Math.max(0.001, finalScore)
      };

      if (computeMatches) {
        const indices = convertMaskToIndices(matchMask, minMatchCharLength);
        if (!indices.length) {
          result.isMatch = false;
        } else if (includeMatches) {
          result.indices = indices;
        }
      }

      return result
    }

    function createPatternAlphabet(pattern) {
      let mask = {};

      for (let i = 0, len = pattern.length; i < len; i += 1) {
        const char = pattern.charAt(i);
        mask[char] = (mask[char] || 0) | (1 << (len - i - 1));
      }

      return mask
    }

    class BitapSearch {
      constructor(
        pattern,
        {
          location = Config.location,
          threshold = Config.threshold,
          distance = Config.distance,
          includeMatches = Config.includeMatches,
          findAllMatches = Config.findAllMatches,
          minMatchCharLength = Config.minMatchCharLength,
          isCaseSensitive = Config.isCaseSensitive,
          ignoreLocation = Config.ignoreLocation
        } = {}
      ) {
        this.options = {
          location,
          threshold,
          distance,
          includeMatches,
          findAllMatches,
          minMatchCharLength,
          isCaseSensitive,
          ignoreLocation
        };

        this.pattern = isCaseSensitive ? pattern : pattern.toLowerCase();

        this.chunks = [];

        if (!this.pattern.length) {
          return
        }

        const addChunk = (pattern, startIndex) => {
          this.chunks.push({
            pattern,
            alphabet: createPatternAlphabet(pattern),
            startIndex
          });
        };

        const len = this.pattern.length;

        if (len > MAX_BITS) {
          let i = 0;
          const remainder = len % MAX_BITS;
          const end = len - remainder;

          while (i < end) {
            addChunk(this.pattern.substr(i, MAX_BITS), i);
            i += MAX_BITS;
          }

          if (remainder) {
            const startIndex = len - MAX_BITS;
            addChunk(this.pattern.substr(startIndex), startIndex);
          }
        } else {
          addChunk(this.pattern, 0);
        }
      }

      searchIn(text) {
        const { isCaseSensitive, includeMatches } = this.options;

        if (!isCaseSensitive) {
          text = text.toLowerCase();
        }

        // Exact match
        if (this.pattern === text) {
          let result = {
            isMatch: true,
            score: 0
          };

          if (includeMatches) {
            result.indices = [[0, text.length - 1]];
          }

          return result
        }

        // Otherwise, use Bitap algorithm
        const {
          location,
          distance,
          threshold,
          findAllMatches,
          minMatchCharLength,
          ignoreLocation
        } = this.options;

        let allIndices = [];
        let totalScore = 0;
        let hasMatches = false;

        this.chunks.forEach(({ pattern, alphabet, startIndex }) => {
          const { isMatch, score, indices } = search(text, pattern, alphabet, {
            location: location + startIndex,
            distance,
            threshold,
            findAllMatches,
            minMatchCharLength,
            includeMatches,
            ignoreLocation
          });

          if (isMatch) {
            hasMatches = true;
          }

          totalScore += score;

          if (isMatch && indices) {
            allIndices = [...allIndices, ...indices];
          }
        });

        let result = {
          isMatch: hasMatches,
          score: hasMatches ? totalScore / this.chunks.length : 1
        };

        if (hasMatches && includeMatches) {
          result.indices = allIndices;
        }

        return result
      }
    }

    class BaseMatch {
      constructor(pattern) {
        this.pattern = pattern;
      }
      static isMultiMatch(pattern) {
        return getMatch(pattern, this.multiRegex)
      }
      static isSingleMatch(pattern) {
        return getMatch(pattern, this.singleRegex)
      }
      search(/*text*/) {}
    }

    function getMatch(pattern, exp) {
      const matches = pattern.match(exp);
      return matches ? matches[1] : null
    }

    // Token: 'file

    class ExactMatch extends BaseMatch {
      constructor(pattern) {
        super(pattern);
      }
      static get type() {
        return 'exact'
      }
      static get multiRegex() {
        return /^="(.*)"$/
      }
      static get singleRegex() {
        return /^=(.*)$/
      }
      search(text) {
        const isMatch = text === this.pattern;

        return {
          isMatch,
          score: isMatch ? 0 : 1,
          indices: [0, this.pattern.length - 1]
        }
      }
    }

    // Token: !fire

    class InverseExactMatch extends BaseMatch {
      constructor(pattern) {
        super(pattern);
      }
      static get type() {
        return 'inverse-exact'
      }
      static get multiRegex() {
        return /^!"(.*)"$/
      }
      static get singleRegex() {
        return /^!(.*)$/
      }
      search(text) {
        const index = text.indexOf(this.pattern);
        const isMatch = index === -1;

        return {
          isMatch,
          score: isMatch ? 0 : 1,
          indices: [0, text.length - 1]
        }
      }
    }

    // Token: ^file

    class PrefixExactMatch extends BaseMatch {
      constructor(pattern) {
        super(pattern);
      }
      static get type() {
        return 'prefix-exact'
      }
      static get multiRegex() {
        return /^\^"(.*)"$/
      }
      static get singleRegex() {
        return /^\^(.*)$/
      }
      search(text) {
        const isMatch = text.startsWith(this.pattern);

        return {
          isMatch,
          score: isMatch ? 0 : 1,
          indices: [0, this.pattern.length - 1]
        }
      }
    }

    // Token: !^fire

    class InversePrefixExactMatch extends BaseMatch {
      constructor(pattern) {
        super(pattern);
      }
      static get type() {
        return 'inverse-prefix-exact'
      }
      static get multiRegex() {
        return /^!\^"(.*)"$/
      }
      static get singleRegex() {
        return /^!\^(.*)$/
      }
      search(text) {
        const isMatch = !text.startsWith(this.pattern);

        return {
          isMatch,
          score: isMatch ? 0 : 1,
          indices: [0, text.length - 1]
        }
      }
    }

    // Token: .file$

    class SuffixExactMatch extends BaseMatch {
      constructor(pattern) {
        super(pattern);
      }
      static get type() {
        return 'suffix-exact'
      }
      static get multiRegex() {
        return /^"(.*)"\$$/
      }
      static get singleRegex() {
        return /^(.*)\$$/
      }
      search(text) {
        const isMatch = text.endsWith(this.pattern);

        return {
          isMatch,
          score: isMatch ? 0 : 1,
          indices: [text.length - this.pattern.length, text.length - 1]
        }
      }
    }

    // Token: !.file$

    class InverseSuffixExactMatch extends BaseMatch {
      constructor(pattern) {
        super(pattern);
      }
      static get type() {
        return 'inverse-suffix-exact'
      }
      static get multiRegex() {
        return /^!"(.*)"\$$/
      }
      static get singleRegex() {
        return /^!(.*)\$$/
      }
      search(text) {
        const isMatch = !text.endsWith(this.pattern);
        return {
          isMatch,
          score: isMatch ? 0 : 1,
          indices: [0, text.length - 1]
        }
      }
    }

    class FuzzyMatch extends BaseMatch {
      constructor(
        pattern,
        {
          location = Config.location,
          threshold = Config.threshold,
          distance = Config.distance,
          includeMatches = Config.includeMatches,
          findAllMatches = Config.findAllMatches,
          minMatchCharLength = Config.minMatchCharLength,
          isCaseSensitive = Config.isCaseSensitive,
          ignoreLocation = Config.ignoreLocation
        } = {}
      ) {
        super(pattern);
        this._bitapSearch = new BitapSearch(pattern, {
          location,
          threshold,
          distance,
          includeMatches,
          findAllMatches,
          minMatchCharLength,
          isCaseSensitive,
          ignoreLocation
        });
      }
      static get type() {
        return 'fuzzy'
      }
      static get multiRegex() {
        return /^"(.*)"$/
      }
      static get singleRegex() {
        return /^(.*)$/
      }
      search(text) {
        return this._bitapSearch.searchIn(text)
      }
    }

    // Token: 'file

    class IncludeMatch extends BaseMatch {
      constructor(pattern) {
        super(pattern);
      }
      static get type() {
        return 'include'
      }
      static get multiRegex() {
        return /^'"(.*)"$/
      }
      static get singleRegex() {
        return /^'(.*)$/
      }
      search(text) {
        let location = 0;
        let index;

        const indices = [];
        const patternLen = this.pattern.length;

        // Get all exact matches
        while ((index = text.indexOf(this.pattern, location)) > -1) {
          location = index + patternLen;
          indices.push([index, location - 1]);
        }

        const isMatch = !!indices.length;

        return {
          isMatch,
          score: isMatch ? 0 : 1,
          indices
        }
      }
    }

    // ❗Order is important. DO NOT CHANGE.
    const searchers = [
      ExactMatch,
      IncludeMatch,
      PrefixExactMatch,
      InversePrefixExactMatch,
      InverseSuffixExactMatch,
      SuffixExactMatch,
      InverseExactMatch,
      FuzzyMatch
    ];

    const searchersLen = searchers.length;

    // Regex to split by spaces, but keep anything in quotes together
    const SPACE_RE = / +(?=([^\"]*\"[^\"]*\")*[^\"]*$)/;
    const OR_TOKEN = '|';

    // Return a 2D array representation of the query, for simpler parsing.
    // Example:
    // "^core go$ | rb$ | py$ xy$" => [["^core", "go$"], ["rb$"], ["py$", "xy$"]]
    function parseQuery(pattern, options = {}) {
      return pattern.split(OR_TOKEN).map((item) => {
        let query = item
          .trim()
          .split(SPACE_RE)
          .filter((item) => item && !!item.trim());

        let results = [];
        for (let i = 0, len = query.length; i < len; i += 1) {
          const queryItem = query[i];

          // 1. Handle multiple query match (i.e, once that are quoted, like `"hello world"`)
          let found = false;
          let idx = -1;
          while (!found && ++idx < searchersLen) {
            const searcher = searchers[idx];
            let token = searcher.isMultiMatch(queryItem);
            if (token) {
              results.push(new searcher(token, options));
              found = true;
            }
          }

          if (found) {
            continue
          }

          // 2. Handle single query matches (i.e, once that are *not* quoted)
          idx = -1;
          while (++idx < searchersLen) {
            const searcher = searchers[idx];
            let token = searcher.isSingleMatch(queryItem);
            if (token) {
              results.push(new searcher(token, options));
              break
            }
          }
        }

        return results
      })
    }

    // These extended matchers can return an array of matches, as opposed
    // to a singl match
    const MultiMatchSet = new Set([FuzzyMatch.type, IncludeMatch.type]);

    /**
     * Command-like searching
     * ======================
     *
     * Given multiple search terms delimited by spaces.e.g. `^jscript .python$ ruby !java`,
     * search in a given text.
     *
     * Search syntax:
     *
     * | Token       | Match type                 | Description                            |
     * | ----------- | -------------------------- | -------------------------------------- |
     * | `jscript`   | fuzzy-match                | Items that fuzzy match `jscript`       |
     * | `=scheme`   | exact-match                | Items that are `scheme`                |
     * | `'python`   | include-match              | Items that include `python`            |
     * | `!ruby`     | inverse-exact-match        | Items that do not include `ruby`       |
     * | `^java`     | prefix-exact-match         | Items that start with `java`           |
     * | `!^earlang` | inverse-prefix-exact-match | Items that do not start with `earlang` |
     * | `.js$`      | suffix-exact-match         | Items that end with `.js`              |
     * | `!.go$`     | inverse-suffix-exact-match | Items that do not end with `.go`       |
     *
     * A single pipe character acts as an OR operator. For example, the following
     * query matches entries that start with `core` and end with either`go`, `rb`,
     * or`py`.
     *
     * ```
     * ^core go$ | rb$ | py$
     * ```
     */
    class ExtendedSearch {
      constructor(
        pattern,
        {
          isCaseSensitive = Config.isCaseSensitive,
          includeMatches = Config.includeMatches,
          minMatchCharLength = Config.minMatchCharLength,
          ignoreLocation = Config.ignoreLocation,
          findAllMatches = Config.findAllMatches,
          location = Config.location,
          threshold = Config.threshold,
          distance = Config.distance
        } = {}
      ) {
        this.query = null;
        this.options = {
          isCaseSensitive,
          includeMatches,
          minMatchCharLength,
          findAllMatches,
          ignoreLocation,
          location,
          threshold,
          distance
        };

        this.pattern = isCaseSensitive ? pattern : pattern.toLowerCase();
        this.query = parseQuery(this.pattern, this.options);
      }

      static condition(_, options) {
        return options.useExtendedSearch
      }

      searchIn(text) {
        const query = this.query;

        if (!query) {
          return {
            isMatch: false,
            score: 1
          }
        }

        const { includeMatches, isCaseSensitive } = this.options;

        text = isCaseSensitive ? text : text.toLowerCase();

        let numMatches = 0;
        let allIndices = [];
        let totalScore = 0;

        // ORs
        for (let i = 0, qLen = query.length; i < qLen; i += 1) {
          const searchers = query[i];

          // Reset indices
          allIndices.length = 0;
          numMatches = 0;

          // ANDs
          for (let j = 0, pLen = searchers.length; j < pLen; j += 1) {
            const searcher = searchers[j];
            const { isMatch, indices, score } = searcher.search(text);

            if (isMatch) {
              numMatches += 1;
              totalScore += score;
              if (includeMatches) {
                const type = searcher.constructor.type;
                if (MultiMatchSet.has(type)) {
                  allIndices = [...allIndices, ...indices];
                } else {
                  allIndices.push(indices);
                }
              }
            } else {
              totalScore = 0;
              numMatches = 0;
              allIndices.length = 0;
              break
            }
          }

          // OR condition, so if TRUE, return
          if (numMatches) {
            let result = {
              isMatch: true,
              score: totalScore / numMatches
            };

            if (includeMatches) {
              result.indices = allIndices;
            }

            return result
          }
        }

        // Nothing was matched
        return {
          isMatch: false,
          score: 1
        }
      }
    }

    const registeredSearchers = [];

    function register(...args) {
      registeredSearchers.push(...args);
    }

    function createSearcher(pattern, options) {
      for (let i = 0, len = registeredSearchers.length; i < len; i += 1) {
        let searcherClass = registeredSearchers[i];
        if (searcherClass.condition(pattern, options)) {
          return new searcherClass(pattern, options)
        }
      }

      return new BitapSearch(pattern, options)
    }

    const LogicalOperator = {
      AND: '$and',
      OR: '$or'
    };

    const KeyType = {
      PATH: '$path',
      PATTERN: '$val'
    };

    const isExpression = (query) =>
      !!(query[LogicalOperator.AND] || query[LogicalOperator.OR]);

    const isPath = (query) => !!query[KeyType.PATH];

    const isLeaf = (query) =>
      !isArray(query) && isObject(query) && !isExpression(query);

    const convertToExplicit = (query) => ({
      [LogicalOperator.AND]: Object.keys(query).map((key) => ({
        [key]: query[key]
      }))
    });

    // When `auto` is `true`, the parse function will infer and initialize and add
    // the appropriate `Searcher` instance
    function parse(query, options, { auto = true } = {}) {
      const next = (query) => {
        let keys = Object.keys(query);

        const isQueryPath = isPath(query);

        if (!isQueryPath && keys.length > 1 && !isExpression(query)) {
          return next(convertToExplicit(query))
        }

        if (isLeaf(query)) {
          const key = isQueryPath ? query[KeyType.PATH] : keys[0];

          const pattern = isQueryPath ? query[KeyType.PATTERN] : query[key];

          if (!isString(pattern)) {
            throw new Error(LOGICAL_SEARCH_INVALID_QUERY_FOR_KEY(key))
          }

          const obj = {
            keyId: createKeyId(key),
            pattern
          };

          if (auto) {
            obj.searcher = createSearcher(pattern, options);
          }

          return obj
        }

        let node = {
          children: [],
          operator: keys[0]
        };

        keys.forEach((key) => {
          const value = query[key];

          if (isArray(value)) {
            value.forEach((item) => {
              node.children.push(next(item));
            });
          }
        });

        return node
      };

      if (!isExpression(query)) {
        query = convertToExplicit(query);
      }

      return next(query)
    }

    // Practical scoring function
    function computeScore$1(
      results,
      { ignoreFieldNorm = Config.ignoreFieldNorm }
    ) {
      results.forEach((result) => {
        let totalScore = 1;

        result.matches.forEach(({ key, norm, score }) => {
          const weight = key ? key.weight : null;

          totalScore *= Math.pow(
            score === 0 && weight ? Number.EPSILON : score,
            (weight || 1) * (ignoreFieldNorm ? 1 : norm)
          );
        });

        result.score = totalScore;
      });
    }

    function transformMatches(result, data) {
      const matches = result.matches;
      data.matches = [];

      if (!isDefined(matches)) {
        return
      }

      matches.forEach((match) => {
        if (!isDefined(match.indices) || !match.indices.length) {
          return
        }

        const { indices, value } = match;

        let obj = {
          indices,
          value
        };

        if (match.key) {
          obj.key = match.key.src;
        }

        if (match.idx > -1) {
          obj.refIndex = match.idx;
        }

        data.matches.push(obj);
      });
    }

    function transformScore(result, data) {
      data.score = result.score;
    }

    function format(
      results,
      docs,
      {
        includeMatches = Config.includeMatches,
        includeScore = Config.includeScore
      } = {}
    ) {
      const transformers = [];

      if (includeMatches) transformers.push(transformMatches);
      if (includeScore) transformers.push(transformScore);

      return results.map((result) => {
        const { idx } = result;

        const data = {
          item: docs[idx],
          refIndex: idx
        };

        if (transformers.length) {
          transformers.forEach((transformer) => {
            transformer(result, data);
          });
        }

        return data
      })
    }

    class Fuse {
      constructor(docs, options = {}, index) {
        this.options = { ...Config, ...options };

        if (
          this.options.useExtendedSearch &&
          !true
        ) {
          throw new Error(EXTENDED_SEARCH_UNAVAILABLE)
        }

        this._keyStore = new KeyStore(this.options.keys);

        this.setCollection(docs, index);
      }

      setCollection(docs, index) {
        this._docs = docs;

        if (index && !(index instanceof FuseIndex)) {
          throw new Error(INCORRECT_INDEX_TYPE)
        }

        this._myIndex =
          index ||
          createIndex(this.options.keys, this._docs, {
            getFn: this.options.getFn
          });
      }

      add(doc) {
        if (!isDefined(doc)) {
          return
        }

        this._docs.push(doc);
        this._myIndex.add(doc);
      }

      remove(predicate = (/* doc, idx */) => false) {
        const results = [];

        for (let i = 0, len = this._docs.length; i < len; i += 1) {
          const doc = this._docs[i];
          if (predicate(doc, i)) {
            this.removeAt(i);
            i -= 1;
            len -= 1;

            results.push(doc);
          }
        }

        return results
      }

      removeAt(idx) {
        this._docs.splice(idx, 1);
        this._myIndex.removeAt(idx);
      }

      getIndex() {
        return this._myIndex
      }

      search(query, { limit = -1 } = {}) {
        const {
          includeMatches,
          includeScore,
          shouldSort,
          sortFn,
          ignoreFieldNorm
        } = this.options;

        let results = isString(query)
          ? isString(this._docs[0])
            ? this._searchStringList(query)
            : this._searchObjectList(query)
          : this._searchLogical(query);

        computeScore$1(results, { ignoreFieldNorm });

        if (shouldSort) {
          results.sort(sortFn);
        }

        if (isNumber(limit) && limit > -1) {
          results = results.slice(0, limit);
        }

        return format(results, this._docs, {
          includeMatches,
          includeScore
        })
      }

      _searchStringList(query) {
        const searcher = createSearcher(query, this.options);
        const { records } = this._myIndex;
        const results = [];

        // Iterate over every string in the index
        records.forEach(({ v: text, i: idx, n: norm }) => {
          if (!isDefined(text)) {
            return
          }

          const { isMatch, score, indices } = searcher.searchIn(text);

          if (isMatch) {
            results.push({
              item: text,
              idx,
              matches: [{ score, value: text, norm, indices }]
            });
          }
        });

        return results
      }

      _searchLogical(query) {

        const expression = parse(query, this.options);

        const evaluate = (node, item, idx) => {
          if (!node.children) {
            const { keyId, searcher } = node;

            const matches = this._findMatches({
              key: this._keyStore.get(keyId),
              value: this._myIndex.getValueForItemAtKeyId(item, keyId),
              searcher
            });

            if (matches && matches.length) {
              return [
                {
                  idx,
                  item,
                  matches
                }
              ]
            }

            return []
          }

          /*eslint indent: [2, 2, {"SwitchCase": 1}]*/
          switch (node.operator) {
            case LogicalOperator.AND: {
              const res = [];
              for (let i = 0, len = node.children.length; i < len; i += 1) {
                const child = node.children[i];
                const result = evaluate(child, item, idx);
                if (result.length) {
                  res.push(...result);
                } else {
                  return []
                }
              }
              return res
            }
            case LogicalOperator.OR: {
              const res = [];
              for (let i = 0, len = node.children.length; i < len; i += 1) {
                const child = node.children[i];
                const result = evaluate(child, item, idx);
                if (result.length) {
                  res.push(...result);
                  break
                }
              }
              return res
            }
          }
        };

        const records = this._myIndex.records;
        const resultMap = {};
        const results = [];

        records.forEach(({ $: item, i: idx }) => {
          if (isDefined(item)) {
            let expResults = evaluate(expression, item, idx);

            if (expResults.length) {
              // Dedupe when adding
              if (!resultMap[idx]) {
                resultMap[idx] = { idx, item, matches: [] };
                results.push(resultMap[idx]);
              }
              expResults.forEach(({ matches }) => {
                resultMap[idx].matches.push(...matches);
              });
            }
          }
        });

        return results
      }

      _searchObjectList(query) {
        const searcher = createSearcher(query, this.options);
        const { keys, records } = this._myIndex;
        const results = [];

        // List is Array<Object>
        records.forEach(({ $: item, i: idx }) => {
          if (!isDefined(item)) {
            return
          }

          let matches = [];

          // Iterate over every key (i.e, path), and fetch the value at that key
          keys.forEach((key, keyIndex) => {
            matches.push(
              ...this._findMatches({
                key,
                value: item[keyIndex],
                searcher
              })
            );
          });

          if (matches.length) {
            results.push({
              idx,
              item,
              matches
            });
          }
        });

        return results
      }
      _findMatches({ key, value, searcher }) {
        if (!isDefined(value)) {
          return []
        }

        let matches = [];

        if (isArray(value)) {
          value.forEach(({ v: text, i: idx, n: norm }) => {
            if (!isDefined(text)) {
              return
            }

            const { isMatch, score, indices } = searcher.searchIn(text);

            if (isMatch) {
              matches.push({
                score,
                key,
                value: text,
                idx,
                norm,
                indices
              });
            }
          });
        } else {
          const { v: text, n: norm } = value;

          const { isMatch, score, indices } = searcher.searchIn(text);

          if (isMatch) {
            matches.push({ score, key, value: text, norm, indices });
          }
        }

        return matches
      }
    }

    Fuse.version = '6.4.6';
    Fuse.createIndex = createIndex;
    Fuse.parseIndex = parseIndex;
    Fuse.config = Config;

    {
      Fuse.parseQuery = parse;
    }

    {
      register(ExtendedSearch);
    }

    /* src/SearchResults.svelte generated by Svelte v3.34.0 */
    const file$1 = "src/SearchResults.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	return child_ctx;
    }

    // (49:0) {:else}
    function create_else_block$1(ctx) {
    	let pre;

    	const block = {
    		c: function create() {
    			pre = element("pre");
    			pre.textContent = "...";
    			add_location(pre, file$1, 49, 2, 1544);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, pre, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(pre);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(49:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (40:0) {#if matchingObjects}
    function create_if_block$1(ctx) {
    	let each_1_anchor;
    	let each_value = [.../*matchingObjects*/ ctx[0].keys()];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*matchingObjects, mapType, singularName*/ 1) {
    				each_value = [.../*matchingObjects*/ ctx[0].keys()];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(40:0) {#if matchingObjects}",
    		ctx
    	});

    	return block;
    }

    // (44:4) {#each matchingObjects.get(type) as obj}
    function create_each_block_1(ctx) {
    	let li;
    	let a;
    	let t_value = singularName(/*obj*/ ctx[10]) + "";
    	let t;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			li = element("li");
    			a = element("a");
    			t = text(t_value);
    			attr_dev(a, "href", a_href_value = "#/" + mapType(/*obj*/ ctx[10].type) + "/" + /*obj*/ ctx[10].id);
    			add_location(a, file$1, 44, 8, 1434);
    			add_location(li, file$1, 44, 4, 1430);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, a);
    			append_dev(a, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*matchingObjects*/ 1 && t_value !== (t_value = singularName(/*obj*/ ctx[10]) + "")) set_data_dev(t, t_value);

    			if (dirty & /*matchingObjects*/ 1 && a_href_value !== (a_href_value = "#/" + mapType(/*obj*/ ctx[10].type) + "/" + /*obj*/ ctx[10].id)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(44:4) {#each matchingObjects.get(type) as obj}",
    		ctx
    	});

    	return block;
    }

    // (41:2) {#each [...matchingObjects.keys()] as type}
    function create_each_block(ctx) {
    	let h1;
    	let t0_value = /*type*/ ctx[7] + "";
    	let t0;
    	let t1;
    	let ul;
    	let t2;
    	let each_value_1 = /*matchingObjects*/ ctx[0].get(/*type*/ ctx[7]);
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			t0 = text(t0_value);
    			t1 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			add_location(h1, file$1, 41, 2, 1358);
    			add_location(ul, file$1, 42, 2, 1376);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			append_dev(h1, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			append_dev(ul, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*matchingObjects*/ 1 && t0_value !== (t0_value = /*type*/ ctx[7] + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*mapType, matchingObjects, singularName*/ 1) {
    				each_value_1 = /*matchingObjects*/ ctx[0].get(/*type*/ ctx[7]);
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, t2);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(ul);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(41:2) {#each [...matchingObjects.keys()] as type}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*matchingObjects*/ ctx[0]) return create_if_block$1;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let matchingObjects;
    	let $data;
    	validate_store(data, "data");
    	component_subscribe($$self, data, $$value => $$invalidate(3, $data = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("SearchResults", slots, []);
    	var _a;
    	let fuse;
    	let { search } = $$props;
    	const SEARCHABLE_TYPES = new Set(["item", "monster"]);

    	function filter(text) {
    		const results = fuse.search(text, { limit: 100 });
    		const byType = new Map();

    		for (const { item } of results) {
    			const mappedType = mapType(item.type);
    			if (!SEARCHABLE_TYPES.has(mappedType)) continue;
    			if (!byType.has(mappedType)) byType.set(mappedType, []);
    			byType.get(mappedType).push(item);
    		}

    		return byType;
    	}

    	const writable_props = ["search"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SearchResults> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("search" in $$props) $$invalidate(1, search = $$props.search);
    	};

    	$$self.$capture_state = () => ({
    		_a,
    		data,
    		mapType,
    		singularName,
    		Fuse,
    		fuse,
    		search,
    		SEARCHABLE_TYPES,
    		filter,
    		$data,
    		matchingObjects
    	});

    	$$self.$inject_state = $$props => {
    		if ("_a" in $$props) $$invalidate(2, _a = $$props._a);
    		if ("fuse" in $$props) fuse = $$props.fuse;
    		if ("search" in $$props) $$invalidate(1, search = $$props.search);
    		if ("matchingObjects" in $$props) $$invalidate(0, matchingObjects = $$props.matchingObjects);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$data, _a*/ 12) {
    			fuse = new Fuse([
    					...$$invalidate(2, _a = $data === null || $data === void 0
    					? void 0
    					: $data.all()) !== null && _a !== void 0
    					? _a
    					: []
    				].filter(x => typeof x.id === "string"),
    			{
    					keys: ["id", "name"],
    					getFn: (obj, path) => {
    						var _a, _b;

    						if (path[0] === "id") return (_b = (_a = obj.id) !== null && _a !== void 0
    						? _a
    						: obj.abstract) !== null && _b !== void 0
    						? _b
    						: "";

    						if (path[0] === "name") return singularName(obj);
    					},
    					ignoreFieldNorm: true,
    					minMatchCharLength: 2,
    					threshold: 0.2
    				});
    		}

    		if ($$self.$$.dirty & /*search, $data*/ 10) {
    			$$invalidate(0, matchingObjects = search && search.length > 1 && $data && filter(search));
    		}

    		if ($$self.$$.dirty & /*search*/ 2) {
    			history.replaceState({ search }, "");
    		}
    	};

    	return [matchingObjects, search, _a, $data];
    }

    class SearchResults extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { search: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SearchResults",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*search*/ ctx[1] === undefined && !("search" in props)) {
    			console.warn("<SearchResults> was created without expected prop 'search'");
    		}
    	}

    	get search() {
    		throw new Error("<SearchResults>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set search(value) {
    		throw new Error("<SearchResults>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.34.0 */

    const { Object: Object_1, window: window_1 } = globals;
    const file = "src/App.svelte";

    // (45:0) {:else}
    function create_else_block(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("DON'T PANIC");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(45:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (43:17) 
    function create_if_block_1(ctx) {
    	let searchresults;
    	let current;

    	searchresults = new SearchResults({
    			props: { search: /*search*/ ctx[1] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(searchresults.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(searchresults, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const searchresults_changes = {};
    			if (dirty & /*search*/ 2) searchresults_changes.search = /*search*/ ctx[1];
    			searchresults.$set(searchresults_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(searchresults.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(searchresults.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(searchresults, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(43:17) ",
    		ctx
    	});

    	return block;
    }

    // (39:0) {#if item}
    function create_if_block(ctx) {
    	let previous_key = /*item*/ ctx[0];
    	let key_block_anchor;
    	let current;
    	let key_block = create_key_block(ctx);

    	const block = {
    		c: function create() {
    			key_block.c();
    			key_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			key_block.m(target, anchor);
    			insert_dev(target, key_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*item*/ 1 && safe_not_equal(previous_key, previous_key = /*item*/ ctx[0])) {
    				group_outros();
    				transition_out(key_block, 1, 1, noop);
    				check_outros();
    				key_block = create_key_block(ctx);
    				key_block.c();
    				transition_in(key_block);
    				key_block.m(key_block_anchor.parentNode, key_block_anchor);
    			} else {
    				key_block.p(ctx, dirty);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(key_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(key_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(key_block_anchor);
    			key_block.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(39:0) {#if item}",
    		ctx
    	});

    	return block;
    }

    // (40:0) {#key item}
    function create_key_block(ctx) {
    	let object;
    	let current;

    	object = new Object$1({
    			props: { item: /*item*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(object.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(object, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const object_changes = {};
    			if (dirty & /*item*/ 1) object_changes.item = /*item*/ ctx[0];
    			object.$set(object_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(object.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(object.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(object, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_key_block.name,
    		type: "key",
    		source: "(40:0) {#key item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let header;
    	let nav;
    	let div0;
    	let strong;
    	let t1;
    	let div1;
    	let input;
    	let t2;
    	let main;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	let mounted;
    	let dispose;
    	const if_block_creators = [create_if_block, create_if_block_1, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*item*/ ctx[0]) return 0;
    		if (/*search*/ ctx[1]) return 1;
    		return 2;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			header = element("header");
    			nav = element("nav");
    			div0 = element("div");
    			strong = element("strong");
    			strong.textContent = "Hitchhiker's Guide to the Cataclysm";
    			t1 = space();
    			div1 = element("div");
    			input = element("input");
    			t2 = space();
    			main = element("main");
    			if_block.c();
    			add_location(strong, file, 30, 6, 715);
    			add_location(div0, file, 29, 4, 703);
    			set_style(input, "margin", "0");
    			set_style(input, "width", "100%");
    			attr_dev(input, "placeholder", "Search...");
    			add_location(input, file, 33, 6, 813);
    			set_style(div1, "flex", "0.8");
    			add_location(div1, file, 32, 4, 783);
    			attr_dev(nav, "class", "svelte-18o3evd");
    			add_location(nav, file, 28, 2, 693);
    			attr_dev(header, "class", "svelte-18o3evd");
    			add_location(header, file, 27, 0, 682);
    			attr_dev(main, "class", "svelte-18o3evd");
    			add_location(main, file, 37, 0, 949);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, nav);
    			append_dev(nav, div0);
    			append_dev(div0, strong);
    			append_dev(nav, t1);
    			append_dev(nav, div1);
    			append_dev(div1, input);
    			set_input_value(input, /*search*/ ctx[1]);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, main, anchor);
    			if_blocks[current_block_type_index].m(main, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(window_1, "hashchange", /*hashchange*/ ctx[2], false, false, false),
    					listen_dev(input, "input", /*input_input_handler*/ ctx[4]),
    					listen_dev(input, "input", /*clearItem*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*search*/ 2 && input.value !== /*search*/ ctx[1]) {
    				set_input_value(input, /*search*/ ctx[1]);
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(main, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(main);
    			if_blocks[current_block_type_index].d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let item = null;

    	function hashchange() {
    		// the poor man's router!
    		const path = window.location.hash.slice(1);

    		let m;

    		if (m = (/^\/([^\/]+)\/(.+)$/).exec(path)) {
    			const [,type, id] = m;
    			$$invalidate(0, item = { type, id });
    			window.scrollTo(0, 0);
    		} else {
    			$$invalidate(0, item = null);
    		}
    	}

    	onMount(hashchange);
    	let search = "";

    	const clearItem = () => {
    		if (item) history.pushState(null, "", location.href.replace(/#.*$/, ""));
    		$$invalidate(0, item = null);
    	};

    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		search = this.value;
    		$$invalidate(1, search);
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		Object: Object$1,
    		SearchResults,
    		item,
    		hashchange,
    		search,
    		clearItem
    	});

    	$$self.$inject_state = $$props => {
    		if ("item" in $$props) $$invalidate(0, item = $$props.item);
    		if ("search" in $$props) $$invalidate(1, search = $$props.search);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [item, search, hashchange, clearItem, input_input_handler];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function () {
            navigator.serviceWorker.register('service-worker.js').catch((err) => {
                console.log('ServiceWorker registration failed: ', err);
            });
        });
    }
    const app = new App({
        target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
