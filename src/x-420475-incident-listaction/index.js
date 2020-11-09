import {createCustomElement, actionTypes} from '@servicenow/ui-core';
const {COMPONENT_BOOTSTRAPPED} = actionTypes;
import snabbdom from '@servicenow/ui-renderer-snabbdom';
import "@servicenow/now-template-card"
import styles from './styles.scss';
import {createHttpEffect} from '@servicenow/ui-effect-http';
import '@servicenow/now-modal'
import '@servicenow/now-label-value';


const view = (state, { updateState }) => {
	const{incidents= [],modalOpened={}} = state
	console.log(modalOpened);

	return (
		<div>
			{incidents.map(incident => { const isModalOpened = modalOpened[incident.sys_id] ? true : false; console.log(isModalOpened); return <div>
			<now-template-card-assist
				tagline={{ "icon": "tree-view-long-outline", "label": "Incident" }}
				actions={[
					{
						"id": "open-"+incident.sys_id,
						"label": "Open Record"
					},
					{
						"id": "delete-"+incident.sys_id,
						"label": "Delete"
					}
				]}
				heading={{ "label": incident.short_description }}
				content={[
					{
						"label": "Number",
						"value": {
							"type": "string",
							"value": incident.number
						}
					},
					{
						"label": "State",
						"value": {
							"type": "string",
							"value": incident.state
						}
					},
					{
						"label": "Assigment Group",
						"value": {
							"type": "string",
							"value": incident.assigment_group.display_value
						}
					},
					{
						"label": "Assigned To",
						"value": {
							"type": "string",
							"value": incident.assigned_to.display_value
						}
					},
				]}
				contentItemMinWidth="300" footerContent={{ "label": "Updated", "value": incident.updated_on }}
				configAria={{}}
			>
			</now-template-card-assist>
				<now-modal
				contentFullWidth ={true}
				opened={isModalOpened}
				manageOpened={true}
				size="md"
				//headerLabel="Record Information"
			>
				<now-label-value-stacked
					items={[
						{"label":"Incident Number",
						 "value":{
							 "type":"string",
							 "label":incident.number,
							 "href":"#","underlined":true
							}
						},

						{"label":"State",
						"value":{
							"type":"string",
							"value":incident.state}
						},

						{
							"label":"Opened At",
							"value":{
								type:"string",
								"label":incident.updated_on,
							}
						},
						{"label":"Assignment group",
						"value":[{
							"type":"string",
							"value":incident.assigment_group.display_value
							}]
						},
						{"label":"Assigned to",
						"value":{
							"type":"string",
							"value":incident.assigned_to.display_value
							}
						}
					]}
					align="horizontal-equal"
					size="md"
					delimiter=",">

					</now-label-value-stacked>


			</now-modal>

		</div>
		}
	)}




		</div>
	);
};


createCustomElement('x-420475-incident-listaction', {
	renderer: {type: snabbdom},
	view,
	styles,

	// Register with component action handlers:

	actionHandlers: {
		[COMPONENT_BOOTSTRAPPED] : (coeffects) => {
			const {dispatch} = coeffects;
			dispatch("FETCH_INCIDENT", {
				'sysparm_display_value': true
			});

		},

		'NOW_DROPDOWN_PANEL#ITEM_CLICKED': (coeffects) => {
			const{action,updateState,dispatch, state} = coeffects
			const id = action.payload.item.id
			const res = id.split("-")
			const sysId = res[1]
			const operation = res[0]
			if (operation=='delete') {
				dispatch("DELETE_INCIDENT",{
					sys_id: sysId
				})
			} else if (operation == 'open') {
				const { modalOpened = {} } = state;

				modalOpened[sysId] = true;
				updateState({modalOpened})
			}

		},
        'FETCH_INCIDENT': createHttpEffect('api/now/table/incident', {
			method: 'GET',
			headers: {},
			queryParams:'sysparm_display_value',
			successActionType: 'INCIDENT_FETCH_SUCCESS'
	   	}),
	   	'DELETE_INCIDENT': createHttpEffect('api/now/table/incident/:sys_id', {
			method: 'DELETE',
			headers: {},
			pathParams:'sys_id',
			successActionType: 'INCIDENT_DELETE_SUCCESS'
		}),
        'INCIDENT_FETCH_SUCCESS': (coeffects) => {
			const{action,updateState} = coeffects
			const{result} = action.payload;
			let incidents = [];
			result.forEach(incident => {
				incidents.push({
					short_description: incident.short_description,
					number:incident.number,
					state: incident.state,
					assigment_group: incident.assignment_group,
					assigned_to: incident.assigned_to,
					updated_on: incident.sys_updated_on,
					sys_id: incident.sys_id
				})
			});

			updateState({incidents})


		},
		'INCIDENT_DELETE_SUCCESS': (coeffects) => {
			const{action,updateState,state} = coeffects
			const updUrl = action.meta.request.updatedUrl
			const res = updUrl.split("/")
			const sysId = res.pop()
			const {incidents} = state;
			const filtered = incidents.filter(item => item.sys_id != sysId);
			updateState({incidents: filtered})
		},
		'NOW_MODAL#OPENED_SET': (coeffects) => {
			const{action, state, updateState} = coeffects;
			updateState({modalOpened: {}})
		}
    }
});

