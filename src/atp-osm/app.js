import { custom_fetch } from '/src/assets/js/utils.js';
import { init_map, get_icon } from '/src/assets/js/map.js';
import { markerClusterGroup } from 'leaflet.markercluster';



function createTable(parent, items, spider_data, type, options=false) {
	var table = document.createElement('table');
	var tableData = generate_issue_table(type=='flagged'?items.sort((a,b) => a.dist>b.dist):items, spider_data, type);
	var notice = false;
	console.log(tableData);
	/*if(options){
		Object.keys(options).forEach(key => div.setAttribute(key, options[key]));
	}*/
	var tableBody = document.createElement('tbody');
	table.classList.add('table', 'table-bordered');
	tableData.forEach((rowData, rowIndex) => {
		var row = document.createElement('tr');

		rowData.forEach((cellData) => {
			var cell = document.createElement(rowIndex==0?'th':'td');
			if(Array.isArray(cellData)){
				cellData.forEach(el => cell.appendChild(el));
			}
			else if(typeof cellData!='object'){
				cell.innerText = cellData;
			}
			/*else if(el && el!=undefined){
				cellData.forEach(el => cell.appendChild(el));
			}*/
			row.appendChild(cell);
		});

		tableBody.appendChild(row);
	});
	if(type=='not_in_ATP'){
		notice = document.createElement('div');
		notice.classList.add('alert', 'alert-warning');
		notice.innerText = 'Възможно е обекта да не е добавен в сайта на компанията или да е временно затворен. Възможно е обекта да е сложен на грешно място в OSM или данните в сайт на компанията да не са верни.';
	}
	else if(type=='not_in_OSM'){
		notice = document.createElement('div');
		notice.classList.add('alert', 'alert-warning');
		notice.innerText = 'Възможно е обекта да е нанесен в OSM, но локацията му да не е вярна. Възможно е информацията за локацията в сайта на компанията да не е точна.';

	}
	if(notice){
		parent.appendChild(notice);
	}
	table.appendChild(tableBody);
	parent.appendChild(table);
	parent.classList.add('pt-2')
}

function create_anchor(url, text, newTab=true){
	var a = document.createElement('a');
	a.innerText = text;
	a.setAttribute('href', url);
	if(newTab){
		a.setAttribute('target', '_blank');
	}
	return a;
}

function createText(text){
	return document.createTextNode(text);
}

function generate_popup_buttons(location, group) {
	let map_url = 'https://www.openstreetmap.org/';
	let edit_url = 'https://www.openstreetmap.org/edit';
	if(location.type && location.id) {
		map_url += `${location.type}/${location.id}`
		edit_url += `?${location.type}=${location.id}`
	}
	else {
		const [lat, lon] = location.coordinates.map(number => number.toFixed(5));
		map_url += `?mlat=${lat}&mlon=${lon}#map=18/${lat}/${lon}`;
		edit_url += `#map=18/${lat}/${lon}`;
	}

	{
		const map_anchor = create_anchor(map_url, ' OSM', true);
		map_anchor.classList.add('btn', 'btn-outline-primary');
		map_anchor.setAttribute('role', 'button');

		const globe_icon = createHTMLElement('i', {class: 'bi bi-globe2'});
		map_anchor.insertBefore(globe_icon, map_anchor.firstChild);

		group.appendChild(map_anchor);
	}
	{
		const edit_anchor = create_anchor(edit_url, ' iD', true);
		edit_anchor.classList.add('btn', 'btn-outline-primary');
		edit_anchor.setAttribute('role', 'button');

		const pencil_icon = createHTMLElement('i', {class: 'bi bi-pencil'});
		edit_anchor.insertBefore(pencil_icon, edit_anchor.firstChild);

		group.appendChild(edit_anchor);
	}
}

function createHTMLElement(tag, options={}, children=[]){
	var res = document.createElement(tag);
	Object.keys(options).forEach(attribute => {
		if(attribute=='innerText'){
			res.innerText = options.innerText;
		}
		else if(attribute=='value'){
			res.value = options.value;
		}
		else{
			res.setAttribute(attribute, options[attribute]);
		}
	});
	children.forEach(child => res.appendChild(child));
	return res;
}

//type:
//missing_OSM
//missing_ATP
//all else

/*function generate_issue_table(data, spider_data, type){
	var table = [];
	if(type=='not_in_ATP' || type=='not_in_OSM'){
		table.push(['', 'Детайли', 'Връзки']);
	}
	else{
		table.push(['', 'Обект', 'Тагове', 'Разстояние', 'Връзки'])
	}
	if(!spider_data.compare_keys){
		spider_data.compare_keys = [];
	}
	data.forEach((row, index) => {
		var tableRow = [index+1];
		if(type=='not_in_ATP'){
			tableRow[1] = 'Липсва в сайта на компанията';
			tableRow[2] = generateOSMlinks(row.osm);
		}
		else if(type=='not_in_OSM'){
			tableRow[1] = `${row.atp.tags.name}${row.atp.tags["addr:full"]?"\nАдрес: "+row.atp.tags["addr:full"]:""}`;
			var starter_keys = spider_data.compare_keys.filter(tag => tag!=='fuel:*');
			var keys = starter_keys.concat(Object.keys(row.atp.tags).filter(property=>property.indexOf('fuel:')!==-1));
			tableRow[2] = generateTagsBox(keys.map(key => [key, row.atp.tags[key]]));
			tableRow[3] = generateOSMlinks(row.osm?row.osm:row.atp.coordinates);
		}
		else{
			console.log(type, row.atp, row.atp.tags)
			//var tags = row.tags;
			let addr = row.atp.tags["addr:full"]?row.atp.tags["addr:full"]:row.atp.tags["addr:street_address"];
			tableRow[1] = `${row.atp?.tags?.name}\nАдрес: ${addr}`;
			//console.log(row.tags.filter(tag => tag.indexOf('+')==0).map(tag => tag.split('+')[1]).map(tag => [tag, row.atp.properties[tag]]));
			tableRow[2] = generateTagsBox(spider_data.compare_keys.filter(key => row.atp.tags[key]!=row.osm.tags[key]).map(key => [key, row.atp.tags[key]]));
			tableRow[3] = row.dist;
			tableRow[4] = generateOSMlinks(row.osm?row.osm:row.atp.coordinates);
			if(row.fuzzy){
				//tableRow
			}
		}
		table.push(tableRow);
	});
	return table;
}*/

/*function show_tab(id) {
	var tabs = Array.from(document.querySelector('#panes').children);
	tabs.forEach(tab => {
		if(tab.id==id){
			tab.classList.remove('d-none');
			return;
		}
		tab.classList.add('d-none');
	});
}*/

/*function preprocess_data(data) {
	//simplify metadata items filter issues
	var result = [];
	for(const brand of data){
		console.log(brand)
		for(const item of brand.metadata.items){
			var new_item = {
				metadata: {
					run_date: brand.metadata.run_date,
					name: brand.metadata.name,
					spider: brand.metadata.spider,
					key: item.key,
					value: item.value,
					compare_keys: item.compare_keys,
				},
				flagged: brand.flagged.filter(el => el?.osm?.tags?.[item.key] === item.value || el?.atp?.tags?.[item.key] === item.value)
			};
			new_item.metadata.osm_count = new_item.flagged.filter(el => el.osm).length;
			new_item.metadata.atp_count = new_item.flagged.filter(el => el.atp).length;
			result.push(new_item);
		}
	}
	return result;
}*/

function load_data(){
	/*function generate_tab_button(ul, id, text, count=0){
		
		var btn = document.createElement('button');
		if(count==0){
			btn.classList.add('btn', 'btn-primary');
			btn.setAttribute('onclick', 'show_tab(this.dataset.target)');
			/*btn.setAttribute('data-bs-toggle', 'tab');
			btn.setAttribute('type', 'button');
			btn.setAttribute('role', 'tab');
			btn.setAttribute('data-target', id);
		}
		else{
			btn.classList.add('nav-link');
			btn.setAttribute('data-bs-target', `#${id}`);
			btn.setAttribute('data-bs-toggle', 'tab');
			btn.setAttribute('role', 'tab')
		}
		btn.innerText = text;
		if(count!=0){
			var li = document.createElement('li');
			li.classList.add('nav-item');
			var badge = document.createElement('span');
			badge.innerText = count;
			badge.classList.add('badge', 'bg-primary');
			btn.appendChild(createText(' '));
			li.appendChild(btn);
			btn.appendChild(badge);
			ul.appendChild(li);
		}
		else{
			ul.appendChild(btn);
		}

		return btn;
	}*/
	// import metadata from `./data/metadata.json`;
    custom_fetch('/atp-osm/data/metadata.json')
    .then(res => res.json())
	.then(data => data.sort((a, b) => a.spider.localeCompare(b.spider) || a.key.localeCompare(b.key)  || a.value.localeCompare(b.value)))
	.then(spiders => {
		populate_overview_table(spiders, true);
	});
}

function populate_overview_table(spiders, by_category=false) {
	function generate_link(spider_name, label) {
		return createHTMLElement('a', {innerText: label, href: `./atp-osm/?spider=${spider_name}`});
	}
	const overview_table = document.querySelector('#overview');
	if(by_category) {
		spiders.sort((a, b) => {
			return `${a.key}=${a.value};${a.spider}`>`${b.key}=${b.value};${b.spider}`;
		})
	}
	let last_category;
	for(const spider of spiders) {
		let current_category = `${spider.key}=${spider.value}`;
		if(by_category && last_category != current_category) {
			let tr = createHTMLElement('tr', {}, [
				createHTMLElement('th', {colspan: 4, innerText: current_category, class: 'text-center'})
			]);
			overview_table.appendChild(tr);
			last_category = current_category;
		}
		let tr = createHTMLElement('tr', {}, [
			createHTMLElement('td'),
			createHTMLElement('td', {innerText: spider.stats.atp}),
			createHTMLElement('td', {innerText: spider.stats.osm}),
			createHTMLElement('td', {innerText: `${spider.stats.percent_atp_to_osm_matched}%`})
		]);
		if(by_category) {
			tr.children[0].appendChild(generate_link(spider.spider, spider.name));
			//generate_tab_button(tr.children[4], `${points.metadata.spider}_${points.metadata.key}_${points.metadata.value}`, 'Детайли', false)
		}
		else {
			tr.children[0].innerText = `${spider.key}=${spider.value}`;
		}
		overview_table.appendChild(tr);
	}
}

function generate_tags_box(check_tags, atp_tags, osm_tags={}) {
	let textarea = createHTMLElement('textarea', {class: 'form-control', disabled: true, rows: 5});
	if(!check_tags) {
		check_tags = [];
	}
	let key_value_pairs = check_tags
	.filter(key => atp_tags[key])
	.filter(key => atp_tags[key] != osm_tags[key])
	.map(key => `${key}=${atp_tags[key]}`)
	.join('\n');
	textarea.value = key_value_pairs;
	return textarea;
}

function generate_popup(spider, location) {
	const {key, value, compare_keys} = spider;
	const {atp, osm} = location;
	const popup = document.createElement('div');
	let tags;
	if(atp && !osm) {
		tags = generate_tags_box(compare_keys, atp.tags, {})
	}
	else if(!atp && osm) {
		tags = generate_tags_box(compare_keys, {}, osm.tags)
	}
	else {
		tags = generate_tags_box(compare_keys, atp.tags, osm.tags)
	}
	popup.appendChild(document.createTextNode(`${key}=${value}`));
	{
		const brand_el = createHTMLElement('div', {class: 'brand'});
		brand_el.appendChild(createHTMLElement('span', {innerText: spider.name}));

		popup.appendChild(brand_el);
	}
	if(atp && atp.tags['addr:street_address']) {
		popup.appendChild(document.createTextNode(`Адрес: ${atp.tags['addr:street_address']}`));
	}
	if(tags.value != '') {
		popup.appendChild(tags);
	}
	popup.appendChild(document.createElement('br'));
	let btn_group = createHTMLElement('div', {class: 'btn-group'});
	generate_popup_buttons(osm?osm:atp, btn_group);
	popup.appendChild(btn_group);
	if(location.dist) {
		popup.appendChild(document.createTextNode(`Разстояние: `));
		let distance_text = location.dist.toFixed(2);
		if(location.dist > 50) {
			popup.appendChild(createHTMLElement('span', {innerText: distance_text, class: 'text-red-80'}));
		}
		else {
			popup.appendChild(document.createTextNode(distance_text));
		}
	}
	return popup;
}

function populate_map(key, value, spider_data, locations, overlays, cluster_group, global_overlays=false) {
	let not_in_osm = [];
	let not_in_atp = [];
	let mismatched_tags = [];
	let fine_markers = [];
	let mismatched_location = [];

	if(global_overlays) {
		not_in_osm = overlays['not_in_OSM'];
		not_in_atp = overlays['not_in_ATP'];
		mismatched_tags = overlays['mismatched tags'];
		fine_markers = overlays['fine'];
		mismatched_location = overlays['mismatched location'];
	}

	for(const location of locations) {
		if(!location.osm && !location.atp) {
			continue;
		}
		let coordinates = (location.osm?location.osm:location.atp).coordinates;
		let marker = new L.marker(coordinates);
		if(location.atp) {
			location.atp.tags[`${spider_data.metadata.type}:wikidata`] = spider_data.metadata.wikidata;
			location.atp.tags[spider_data.metadata.type] = spider_data.metadata.name;
		}
		if(location.osm && location.atp && location.dist>50) {
			marker.setIcon(get_icon('violet'));
			mismatched_location.push(marker);
			// let latlngs1 = [location.osm.coordinates, location.atp.coordinates]
			/*lines.push*/(L.polyline([location.osm.coordinates, location.atp.coordinates], {color: 'red'})).addTo(map);
		}
		else if(!location.osm) {
			marker.setIcon(get_icon('green'));
			not_in_osm.push(marker);
		}
		else if(!location.atp) {
			marker.setIcon(get_icon('red'));
			not_in_atp.push(marker);
		}
		else if(location.tags_mismatch && spider_data.metadata.compare_keys) {
			marker.setIcon(get_icon('orange'));
			mismatched_tags.push(marker);
		}
		else {
			// fine
			marker.setIcon(get_icon('blue'));
			fine_markers.push(marker);
		}
		const popup_content = generate_popup(spider_data.metadata, location, );
		marker.bindPopup(popup_content, {maxWidth: 500});
	}

	if(!global_overlays) {
		let not_in_osm_sub = L.featureGroup.subGroup(cluster_group, not_in_osm).addTo(map);
		let not_in_ato_sub = L.featureGroup.subGroup(cluster_group, not_in_atp).addTo(map);
		let mismatched_tags_sub = L.featureGroup.subGroup(cluster_group, mismatched_tags).addTo(map);
		let mismatched_location_sub = L.featureGroup.subGroup(cluster_group, mismatched_location).addTo(map);
		let fine_markers_sub = L.featureGroup.subGroup(cluster_group, fine_markers).addTo(map);
		//let lines_sub = L.featureGroup.subGroup(cluster_group, lines).addTo(map);
		
		overlays[`${key}=${value} missing from OSM`] = not_in_osm_sub;
		overlays[`${key}=${value} missing from ATP`] = not_in_ato_sub;
		overlays[`${key}=${value} mismatched tags`] = mismatched_tags_sub;
		overlays[`${key}=${value} mismatched location`] = mismatched_location_sub;
		overlays[`${key}=${value} fine`] = fine_markers_sub;
	}
	// overlays[`${spider.key}=${spider.value} lines`] = lines_sub;
}

function show_spider_data(spider_name) {
    custom_fetch('/atp-osm/data/metadata.json')
    .then(res => res.json())
	.then(spiders => spiders.filter(spider => spider.spider === spider_name))
	.then(async (spiders) => {
		if(spiders.some(spider => spider.fuzzy_coords)) {
			document.querySelector('#fuzzy_coords_notice').classList.remove('d-none');
		}

		let cluster_group = new L.markerClusterGroup({
			showCoverageOnHover: false
		}).addTo(map);
		let overlays = {};
		populate_overview_table(spiders);
		for(const spider of spiders) {
			const {key, value} = spider;
			document.querySelector('#table_title').innerText = spider.name;
			/*if(last_category!==`${points.metadata.key}=${points.metadata.value}`){
				last_category = `${points.metadata.key}=${points.metadata.value}`;
				overview_table.appendChild(createHTMLElement('tr', {}, [createHTMLElement('th', {innerText: last_category, colspan: 5})]));
			}*/
			const locations_response = await custom_fetch(`/atp-osm/data/${key}_${value}_${spider.spider}.json`);
			const spider_data = (await locations_response.json());
			const locations = spider_data.data;
			
			const osm_count = locations.filter(location => location.osm).length;
			const atp_count = locations.filter(location => location.atp).length;
			console.log(`OSM: ${osm_count}, ATP: ${atp_count}, ${key}=${value}`);
			populate_map(key, value, spider_data, locations, overlays, cluster_group);
		}
		L.control.layers([], overlays, {collapsed: true}).addTo(map);
	})
}

document.addEventListener('DOMContentLoaded', () => {
	let spider = new URLSearchParams(window.location.search).get('spider');
	console.log(spider)
	if(spider) {
		const map_el = document.querySelector('#map');
		map_el.classList.remove('d-none');
		map_el.nextElementSibling.classList.add('d-none');
		map = init_map();
		show_spider_data(spider);
	}
	else {
		document.querySelector('#map').nextElementSibling.classList.remove('d-none');
		load_data();
	}
});

function load_all_map_data() {
	document.querySelector('#map').classList.remove('d-none');
	map = init_map();
	document.querySelector('#map').nextElementSibling.classList.add('d-none');

	let overlays = {};
	let markers = {
		'not_in_OSM': [],
		'not_in_ATP': [],
		'mismatched tags': [],
		'fine': [],
		'mismatched location': []
	}
	let cluster_group = new L.markerClusterGroup({
		showCoverageOnHover: false
	}).addTo(map);
	console.time('load_all_map_data');
    custom_fetch('/atp-osm/data/metadata.json')
	.then(res => res.json())
	.then(data => {
		let promises = [];
		for(const {key, value, spider} of data) {
			const promise = custom_fetch(`/atp-osm/data/${key}_${value}_${spider}.json`)
			.then(res => res.json())
			.then(spider_data => {
				const locations = spider_data.data;
				populate_map(key, value, spider_data, locations, markers, cluster_group, true);
			});
			promises.push(promise);
		}
		return Promise.all(promises);
	})
	.then(() => {

		overlays['not_in_OSM'] = L.featureGroup.subGroup(cluster_group, markers['not_in_OSM']).addTo(map);
		overlays['not_in_ATP'] = L.featureGroup.subGroup(cluster_group, markers['not_in_ATP']).addTo(map);
		overlays['mismatched tags'] = L.featureGroup.subGroup(cluster_group, markers['mismatched tags']).addTo(map);
		overlays['fine'] = L.featureGroup.subGroup(cluster_group, markers['fine']).addTo(map);
		overlays['mismatched location'] = L.featureGroup.subGroup(cluster_group, markers['mismatched location']).addTo(map);

		console.timeEnd('load_all_map_data');
		console.log('Done');
		console.log(overlays);
		L.control.layers([], overlays, {collapsed: true}).addTo(map);
	});
}

document.querySelector('#map').nextElementSibling.children[0].addEventListener('click', load_all_map_data);