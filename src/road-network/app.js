import { init_map, get_icon } from '/src/assets/js/map.js';
import { decode } from 'google-polyline';
import { routes_map } from '/src/road-network/routes-map.js';
import 'bootstrap/js/dist/collapse.js';
import L from 'leaflet';

const municipality_code_map = new Map([
    ['BLG', 'Благоевград'],
    ['BGS', 'Бургас'],
    ['VTR', 'Велико Търново'],
    ['VAR', 'Варна'],
    ['VID', 'Видин'],
    ['VRC', 'Враца'],
    ['DOB', 'Добрич'],
    ['GAB', 'Габрово'],
    ['HKV', 'Хасково'],
    ['KRZ', 'Кърджали'],
    ['KNL', 'Кюстендил'],
    ['LOV', 'Ловеч'],
    ['MON', 'Монтана'],
    ['PAZ', 'Пазарджик'],
    ['PER', 'Перник'],
    ['PVN', 'Плевен'],
    ['PDV', 'Пловдив'],
    ['RAZ', 'Разград'],
    ['RSE', 'Русе'],
    ['SLS', 'Силистра'],
    ['SLV', 'Сливен'],
    ['SFO', 'София-област'],
    ['SOF', 'София-град'],
    ['SZR', 'Стара Загора'],
    ['SHU', 'Шумен'],
    ['SML', 'Смолян'],
    ['TGV', 'Търговище'],
    ['HKV', 'Хасково'],
    ['JAM', 'Ямбол']
]);

const routes_layers = new Map();
const shown_routes = new Set();

function generate_accordion_item(id, title, body_children) {
    const div = document.createElement('div');
    div.setAttribute('class', 'accordion-item');

    {
        const h3 = document.createElement('h3');
        h3.setAttribute('class', 'accordion-header');
        h3.id = `heading-${id}`;

        const btn = document.createElement('button');
        btn.classList.add('accordion-button', 'collapsed');
        btn.setAttribute('type', 'button');
        btn.setAttribute('data-bs-toggle', 'collapse');
        btn.setAttribute('data-bs-target', `#${id}`);
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-controls', `${id}`);
        btn.textContent = title;

        h3.appendChild(btn);
        div.appendChild(h3);
    }

    {
        const content = document.createElement('div');
        content.setAttribute('id', `${id}`);
        content.setAttribute('class', 'accordion-collapse collapse');
        content.setAttribute('aria-labelledby', `heading-${id}`);
        content.setAttribute('data-bs-parent', '#municipal');

        const body = document.createElement('div');
        body.setAttribute('class', 'accordion-body');
        for(const child of body_children) {
            body.appendChild(child);
        }
        content.appendChild(body);
        div.appendChild(content);
    }
    return div;
}

async function start() {
    map = init_map();
    map.on('layeradd', function(e) {
        const layer = e.layer;
        // const bounds = layer.getBounds();
        // if(bounds.isValid()) {
            // map.fitBounds(bounds);
        // }
    });

    const municipal_roads_map = new Map();
    for(const [code, name] of municipality_code_map) {
        const obj = {code, name, children: []};
        municipal_roads_map.set(code, obj);
    }

    const tertiary_roads_map = new Map();


    const roads = await fetch(new URL('./routes.json', import.meta.url))
    .then(response => response.json())
    .then(routes => {
        document.querySelector('#last_updated').textContent = new Date(routes.date).toLocaleString('bg-BG', { dateStyle: 'short', timeStyle: 'short' });
        routes.data.sort((a, b) => {
            if(typeof a.ref === 'number' && typeof b.ref === 'number') {
                return a.ref - b.ref;
            }
            const a_ref = typeof a.ref === 'number' ? a.ref : parseInt(a.ref.replace(/\D/g, ''));
            const b_ref = typeof b.ref === 'number' ? b.ref : parseInt(b.ref.replace(/\D/g, ''));
            return a_ref - b_ref;
        });
        return routes;
    });

    const motorways_list = document.querySelector('#motorways');
    const primary_list = document.querySelector('#national-primary');
    const secondary_list = document.querySelector('#national-secondary');
    const tertiary_list = document.querySelector('#national-tertiary');
    const municipal_list = document.querySelector('#municipal');
    for(const road of roads.data) {
        const visual_ref = determine_visual_ref(road.ref, road.type);
        const icon = document.createElement('button');
        icon.classList.add('btn', 'btn-sm', 'm-1', 'btn-outline-primary');
        icon.textContent = visual_ref;
        icon.setAttribute('onclick', `toggle_route('${road.ref}', this)`);
        if(road.type === 'motorway') {
            motorways_list.appendChild(icon);
        }
        else if(road.type === 'national') {
            if(visual_ref.startsWith('I-')) {
                primary_list.appendChild(icon);
            }
            else if(visual_ref.startsWith('II-')) {
                secondary_list.appendChild(icon);
            }
            else {
                const short_code = road.ref >= 1000 ? String(road.ref).slice(0, 1) : String(road.ref).slice(0, 1);
                const list = tertiary_roads_map.get(short_code) || {code: short_code, children: []};
                list.children.push(icon);
                tertiary_roads_map.set(short_code, list);
            }
        }
        else if(road.type === 'municipal') {
            const code = road.ref.slice(0, 3);
            const child_obj = municipal_roads_map.get(code);
            child_obj.children.push(icon);
        }
    }

    for(const [code, obj] of municipal_roads_map) {
        if(obj.children.length === 0) {
            continue;
        }
        const item = generate_accordion_item(`municipality-${code}`, obj.name, obj.children);
        municipal_list.appendChild(item);
    }

    for(const [code, obj] of tertiary_roads_map) {
        if(obj.children.length === 0) {
            continue;
        }
        const item = generate_accordion_item(`tertiary-${code}`, `${code}XX / ${code}XXX`, obj.children);
        tertiary_list.appendChild(item);
    }
}

function determine_visual_ref(ref, type) {
    if(type === 'national') {
        const number = Number(ref);
        if(number < 10) {
            return `I-${number}`;
        }
        else if(number < 100) {
            return `II-${number}`;
        }
        else {
            return `III-${number}`;
        }
    }
    return ref;
}

window.toggle_route = async (ref, btn) => {
    btn.classList.toggle('btn-primary', !shown_routes.has(ref));
    btn.classList.toggle('btn-outline-primary', shown_routes.has(ref));
    if(shown_routes.has(ref)) {
        console.log(`Route ${ref} is already shown. Removing...`);
        map.removeLayer(routes_layers.get(ref));
        shown_routes.delete(ref);
        return;
    }
    shown_routes.add(ref);
    if(!routes_layers.has(ref)) {
        btn.setAttribute('disabled', 'disabled');
        const url = routes_map.get(ref);

        const data = await fetch(url)
        .then(response => response.json());
        
        const layer = new L.FeatureGroup();
        for(const segment of data.polylines) {
            const coords = decode(segment);
            const line = L.polyline(coords);
            layer.addLayer(line);
        }
        routes_layers.set(ref, layer);
        btn.removeAttribute('disabled');
        map.fitBounds(layer.getBounds());
    }

    const layer = routes_layers.get(ref);
    layer.addTo(map);
}

start();