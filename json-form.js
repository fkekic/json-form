/*
Author: Faruk Kekic fkekic@gmail.com
License: GNU General Public License version 3.
Please visit https://json-form.com 
*/

class JsonForm extends HTMLElement {

	// used to set #data to object or array 
	#type; 

	// either object or array that stores user input
	#data; 

	// used for form that is type.array , increased and given to member form
	#index;

    	constructor() {

        	super();
			this.#type={};

    	}

    	connectedCallback() {

			const form = this;

			// TYPE

				if ( form.hasAttribute( 'data-array' )){
				
					form.#type.array = true;
					form.#index = -1;
					
				} else {

					form.#type.object = true;
				}

		
			
			let parent = form.parentElement.closest('json-form');
		
			// ROOT

				if ( parent == null ){

					if ( form.#type.object ){
						
						form.#data = {};

					} else if ( form.#type.array ){

						form.#data = [];
					}

				form.setAttribute('data-root','');

				form.addEventListener( 'change',form.#input_change );
				

				return;
				}

			// MEMBER 
			
			let key;

				if ( parent.#type.object ){
					
					key = form.#get_attr ( 'name', form );

				} else if ( parent.#type.array ){

					key = form.#get_index ( parent );

				}

				
				if ( key.set ){

					if ( form.#type.object ){
							
						parent.#data[key.value] = {};
					
					} else if ( form.#type.array ){

						parent.#data[key.value] = [];
					}

					form.#data = parent.#data[key.value];
					form.addEventListener( 'change',form.#input_change );
				


				} else {

					form.setAttribute('data-error','');
					console.error ( key.error );
					return;
				}

		
		
		
	}

	// PRIVATE METHODS

	#get_index( element ){

		let index = {};

		let is_number = ( typeof element.#index === 'number' );
		
			if ( is_number ){

				element.#index +=1;
				index.value = element.#index;
				index.set = true;
		
			} else {

				index.set = false;
				index.error ='Could not get/set index';
			
			}

		return index;
	}

	#get_attr( attr_name, element ){

		let attribute = {};

				if ( element.hasAttribute( attr_name)){

					let attr_value = element.getAttribute( attr_name );

						if ( attr_value.length > 0 ){

							attribute.set = true; 
							attribute.value = attr_value;

						} else {

							attribute.set = false; 
							attribute.error = 'Attribute ' + attr_name + ' is empty';
						}

				}else{

					attribute.set = false; 
					attribute.error = 'Element does not have attribute ' + attr_name + ' .' ;	

				}

		
		return attribute;
	}

	#input_change( evt ){

		evt.stopPropagation();

		const input = evt.target;

		const form = evt.currentTarget;
	
		let key;

			if ( form.#type.object ){
				key = form.#get_attr ( 'name',input);
			}

			if ( form.#type.array ){
				
				key = this.#get_attr( 'data-index',input);
				
				if ( key.set ){

					let number = parseInt( key.value, 10);

						if ( typeof number === 'number'){
							
							key.value = number;
						
						} else {
							
							key.set = false;
							key.error = 'Attribute data-index is not a number!';

						}

				}

			}

			// early return; 

			if ( key.set == false ){
				console.error ( key.error );
				input.setAttribute('data-error','');
				return;
			} 
	

		
		const tag = input.tagName.toLowerCase();

		const type = ( tag === 'input')? input.type : tag ;

		// ignore if changes occures in type="file", we can't store binary in json
		// files are added in .get_form_data()
		if ( type === 'file' ){
			return;
		}

		let value = form.#get_value ( input,type );

		// remove property from json if value is empty
		if ( value === ""){
		
			delete form.#data[key.value];

			return;
		}

		form.#data[key.value]= value;
	
	}


	/*        Conversion of input values where necessary.       */
	#get_value( input, type ){

	let value;

	//	number 
	if ( type === 'number' || type === 'range'){

			value = parseInt(input.value,10);
			
	//	radio true/false
	} else if ( type === 'radio'){

		if ( input.value === 'true'){

			value = true;

		} else if ( input.value === 'false'){

			value = false;

		} else {

			value = input.value;
		}

	//	checkbox true
	} else if ( type === 'checkbox' ){

		if( input.checked ){

			if ( input.value === 'true' ){
				value = true;
			} else {
				value = input.value;
			}
		} else {
			value = "";
		}
	
	// select multiple
	} else if ( type === 'select' && input.hasAttribute('multiple')){

		let arr = [];

			let options = Array.from( input.children );

				options.forEach( option => {

					if ( option.selected ){
						arr.push ( option.value );
					}
				});

		value = arr;


	// email multiple
	} else if ( type === 'email' && input.hasAttribute( 'multiple' )){
			
		value = input.value.split(',');

	// any other 	
	} else {

		value = input.value;
	}

	return value;

	}

	
	// PUBLIC METHODS

	get_json(){

		let json = JSON.stringify( this.#data );
		return json;
		//return JSON.stringify( form.#data,undefined,5 );
		
	}

	validate(){
		
		let std_form = this.closest( 'form' );

			if ( std_form == null ){
				console.error ('Unable to validate. <json-form> has no parent <form>!');
				
				return;
			}

		
		let valid = std_form.checkValidity();

			if ( !valid ){
				std_form.reportValidity()
				return false;

			} else {

				return true;
			}
	}
	
	get_form_data( json_key,options){

		// form_data; 1. add JSON 	2.add input files
		const form_data = new FormData();

		// JSON -

		const json_form_data = this.get_json();

		let key = json_key || 'json';

		form_data.append( key , json_form_data );

		
		// FILES
		
		const attached = this.querySelectorAll('input[type=file]');

		let i = 0;

		let i_count = attached.length;

		if ( i_count == 0 ){
			console.info( 'No input type file found');
			
		// early return if no input type file found.
			return;
		}

		for ( i ; i < i_count ; i++ ){

			let name = form.#get_attr( 'name',attached[i] );

			if ( name.set  ){


					if ( options.php ){
						// PHP only - name attribute must be e.g name="myfiles[]" when input type file MULTIPLE
						name.value = name.value + '[]';
					}

					// input file with attribute multiple
				
					if ( attached[i].hasAttribute('multiple')){

						let m = 0;
						let m_count = attached[i].files.length;

						for ( m; m<m_count; m++ ){

							form_data.append( name.value , attached[i].files[m] );
					
						}

					} else {
					// input file - single
						form_data.append( name.value , attached[i].files[0] );

					}
				

			} else {

				console.error ( name.error );
				
			}
			
		}

		return form_data;
		
	
	}

}// end json_form
customElements.define('json-form', JsonForm);





























 


























