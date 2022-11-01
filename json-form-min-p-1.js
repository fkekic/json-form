
class JsonForm extends HTMLElement{#type;#data;#index;constructor(){super();this.#type={};}
connectedCallback(){const form=this;if(form.hasAttribute('data-array')){form.#type.array=true;form.#index=-1;}else{form.#type.object=true;}
let parent=form.parentElement.closest('json-form');if(parent==null){if(form.#type.object){form.#data={};}else if(form.#type.array){form.#data=[];}
form.setAttribute('data-root','');form.addEventListener('change',form.#input_change);return;}
let key;if(parent.#type.object){key=form.#get_attr('name',form);}else if(parent.#type.array){key=form.#get_index(parent);}
if(key.set){if(form.#type.object){parent.#data[key.value]={};}else if(form.#type.array){parent.#data[key.value]=[];}
form.#data=parent.#data[key.value];form.addEventListener('change',form.#input_change);}else{form.setAttribute('data-error','');console.error(key.error);return;}}#get_index(element){let index={};let is_number=(typeof element.#index==='number');if(is_number){element.#index+=1;index.value=element.#index;index.set=true;}else{index.set=false;index.error='Could not get/set index';}
return index;}#get_attr(attr_name,element){let attribute={};if(element.hasAttribute(attr_name)){let attr_value=element.getAttribute(attr_name);if(attr_value.length>0){attribute.set=true;attribute.value=attr_value;}else{attribute.set=false;attribute.error='Attribute '+attr_name+' is empty';}}else{attribute.set=false;attribute.error='Element does not have attribute '+attr_name+' .';}
return attribute;}#input_change(evt){evt.stopPropagation();const input=evt.target;const form=evt.currentTarget;let key;if(form.#type.object){key=form.#get_attr('name',input);}
if(form.#type.array){key=this.#get_attr('data-index',input);if(key.set){let number=parseInt(key.value,10);if(typeof number==='number'){key.value=number;}else{key.set=false;key.error='Attribute data-index is not a number!';}}}
if(key.set==false){console.error(key.error);input.setAttribute('data-error','');return;}
const tag=input.tagName.toLowerCase();const type=(tag==='input')?input.type:tag;if(type==='file'){return;}
let value=form.#get_value(input,type);if(value===""){delete form.#data[key.value];return;}
form.#data[key.value]=value;}#get_value(input,type){let value;if(type==='number'||type==='range'){value=parseInt(input.value,10);}else if(type==='radio'){if(input.value==='true'){value=true;}else if(input.value==='false'){value=false;}else{value=input.value;}}else if(type==='checkbox'){if(input.checked){if(input.value==='true'){value=true;}else{value=input.value;}}else{value="";}}else if(type==='select'&&input.hasAttribute('multiple')){let arr=[];let options=Array.from(input.children);options.forEach(option=>{if(option.selected){arr.push(option.value);}});value=arr;}else if(type==='email'&&input.hasAttribute('multiple')){value=input.value.split(',');}else{value=input.value;}
return value;}
get_json(){let json=JSON.stringify(this.#data);return json;}
validate(){let std_form=this.closest('form');if(std_form==null){console.error('Unable to validate. <json-form> has no parent <form>!');return;}
let valid=std_form.checkValidity();if(!valid){std_form.reportValidity()
return false;}else{return true;}}
get_form_data(json_key,php=false){const form_data=new FormData();const json_form_data=this.get_json();let key=json_key||'json';form_data.append(key,json_form_data);const attached=this.querySelectorAll('input[type=file]');let i=0;let i_count=attached.length;if(i_count==0){console.info('No input type file found');return;}
for(i;i<i_count;i++){let name=form.#get_attr('name',attached[i]);if(name.set){if(php){name.value=name.value+'[]';}
if(attached[i].hasAttribute('multiple')){let m=0;let m_count=attached[i].files.length;for(m;m<m_count;m++){form_data.append(name.value,attached[i].files[m]);}}else{form_data.append(name.value,attached[i].files[0]);}}else{console.error(name.error);}}
return form_data;}}
customElements.define('json-form',JsonForm);