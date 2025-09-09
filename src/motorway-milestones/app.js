import { init_map, get_icon } from '/src/assets/js/map.js';

import L from 'leaflet';

function reduce_array_to_ranges(array) {
    const ranges = [];
    let start = array[0];
    let end = array[0];
    for(let i = 1; i < array.length; i++) {
        if(array[i] - end === 1) {
            end = array[i];
        } else {
            ranges.push([start, end]);
            start = array[i];
            end = array[i];
        }
    }
    ranges.push([start, end]);
    for(let i = 0; i < ranges.length; i++) {
        if(ranges[i][0] === ranges[i][1]) {
            ranges[i] = ranges[i][0];
        }
    }
    return ranges;
}

function get_div_icon_with_number(number, color) {
    return L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="text-white bg-${color} text-center fs-${number>=100?6:5} rounded-2">${number}</div>`,
        iconSize: [34, 42],
        iconAnchor: [17, 21]
    });
}

async function start() {
    map = init_map();
    const motorways = await fetch(new URL('./data.json', import.meta.url))
    .then(response => response.json());
    const table_body = document.querySelector('tbody');
    const layer_50 = new L.LayerGroup();
    const layer_10 = new L.LayerGroup();
    const layer_5 = new L.LayerGroup();
    const layer_all = new L.LayerGroup();
    document.querySelector('#last_updated').textContent = 
        (new Date(motorways.date)).toLocaleString('bg-BG', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Europe/Sofia' });
    for(const motorway of motorways.data) {
        console.log(motorway);
        const row = document.createElement('tr');
        
        {
            const td = document.createElement('td');
            td.textContent = motorway.name;
            row.appendChild(td);
        }

        {
            const td = document.createElement('td');
            td.textContent = motorway.ranges.map(([start, end]) => `${start} - ${end}`).join(', ');
            row.appendChild(td);
        }

        {
            const td = document.createElement('td');
            td.textContent = reduce_array_to_ranges(motorway.warnings.missing).map((range) => range.length==2?`${range[0]} - ${range[1]}`:range).join(', ');
            row.appendChild(td);
        }

        table_body.appendChild(row);

        if(motorway.warnings.out_of_range.length) {
            // for(const marker_data of motorway.warnings.out_of_range) {
            //     const marker = L.marker(marker_data.coords);
            //     marker.setIcon(get_icon('red'));
            //     marker.bindPopup(`${motorway.name}\nкм. ${marker_data.distance}`);
            //     marker.addTo(map);
            // }
        }
        if(motorway.warnings.milestones.length) {
            for(const marker_data of motorway.warnings.milestones) {
                const marker = L.marker(marker_data.coords);
                let colour = 'danger';
                if(marker_data.suspicious) {
                    colour = 'warning';
                }
                else if(marker_data.double) {
                    colour = 'success';
                }
                marker.setIcon(get_div_icon_with_number(marker_data.distance, colour));
                let text = `${motorway.name}\nкм. ${marker_data.distance}`;
                if(marker_data.osm_id) {
                    const anchors = marker_data.osm_id.toString().split(';').map(id => `<a href="https://osm.org/node/${id}" target="_blank">n${id}</a>`).join(', ');
                    text += `<br>${anchors}`;
                }
                marker.bindPopup(text);
                const distance = marker_data.distance;
                if(distance % 10 === 0) {
                    if(distance % 50 === 0) {
                        marker.addTo(layer_50);
                    }
                    else {
                        marker.addTo(layer_10);
                    }
                }
                else if(distance % 5 === 0) {
                    marker.addTo(layer_5);
                }
                else {
                    marker.addTo(layer_all);
                }
            }
        }

    }
    map.on('zoom', () => {
        toggle_layers(layer_50, layer_10, layer_5, layer_all);
    });
    toggle_layers(layer_50, layer_10, layer_5, layer_all);
}

function toggle_layers(layer_50, layer_10, layer_5, layer_all) {
    const zoom = map.getZoom();
    console.log('zoom changed to', zoom);
    switch(zoom) {
        case 0:
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
        case 6:
        case 7:
            map.removeLayer(layer_50);
            map.removeLayer(layer_10);
            map.removeLayer(layer_5);
            map.removeLayer(layer_all);
            break;
        case 8:
            map.addLayer(layer_50);
            map.removeLayer(layer_10);
            map.removeLayer(layer_5);
            map.removeLayer(layer_all);
            break;
        case 9:
        case 10:
            map.addLayer(layer_50);
            map.addLayer(layer_10);
            map.removeLayer(layer_5);
            map.removeLayer(layer_all);
            break;
        case 11:
        case 12:
            map.addLayer(layer_50);
            map.addLayer(layer_10);
            map.addLayer(layer_5);
            map.removeLayer(layer_all);
            break;
        default: // 13+
            map.addLayer(layer_50);
            map.addLayer(layer_10);
            map.addLayer(layer_5);
            map.addLayer(layer_all);
            break;
    }
}

start();
