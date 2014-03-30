/* =======================================================
	* Plugin para la validación de campos basado en la libreria de validación que tiene el Framework Laravel. 
	*
	* @autor Cristian Acevedo @_cristianace
	* @version 0.2.1
	* @date 26/02/2014
   =======================================================*/


/**
 * Clase Validador
 * @param {Object || String} data     variable que puede contener el objeto con los datos a validar o el ID/Clase del formulario
 * @param {Object} rules    Objeto con las reglas que se desea validar para cada campo 
 * @param {Object} messages Mensajes de error para cada regla
 */
var Validator = function (data, rules, messages){


	// Si data es un string, significa que se envía por parametro el id del formulario para que el plugin obtenga todos sus datos
	if(typeof data == 'string'){
		if(data.indexOf('.') != -1 || data.indexOf('#') != -1){

			if(document.getElementById(data) != null || document.getElementsByClassName(data) != null)
				data = this.serializeJSON(data);
			else
				throw new Error('Error no exists element');

		}else
			throw new Error('Error no exists element');
	}


	// Valido la información enviada
	if(typeof data !== 'object' && data == null )
		throw new Error('Error with data submitted');

	// Valido las reglas enviadas por el usuario
	if(typeof rules !== 'object' && rules == null )
		throw new Error('Error with rules submitted');

	// Valido las reglas enviadas por el usuario
	if(typeof messages !== 'object' && messages == null )
		throw new Error('Error with messages submitted');

	// Definición de variables
	this.data  = data;
	this.rules = rules;
	this.messages = messages;

	this.response = {};

	var ruls = {},
		mess = {},
		rule = '',
		values = '',
		extra = '',
		_is = false;


	// Validación 

	for(var index in this.data){

		if(typeof this.rules[index] == 'undefined')
			continue;
		
		// Obtengo las reglas del campo
		ruls = this.getRules(this.rules[index]);

		// Obtengo los mensajes del campo
		mess = this.getMessages(index, this.messages);

		for (var i = 0; i < ruls.length; i++) {

			rule = '';
			values = '';
			extra = '';

			if(ruls[i].indexOf(':') != -1){
				rule = this.strLeft(ruls[i],':');
				extra = this.strRight(ruls[i],':');
			}else
				rule = ruls[i]; 

			values = this.data[index];

			// Verifico si la regla existe
			if(typeof this.functions[rule] === 'function'){		

				_is = this.functions[rule](values, extra, this.data);

				if(!_is){
					if(!this.response[index]){
						this.response[index] = [];						
					}

					// Verifico si el campo posee un mensaje en especial, si no cargo el mensaje en general para la regla
					_mess =  typeof mess[rule] == 'string' ? mess[rule] : this.messages[rule];

					// Almaceno los mensajes en arreglos por si el campo tiene varias reglas
					this.response[index].push( this.replaceMessage( _mess, extra) );
				}
			}
		}

	}

	return this;
};

// var reg = '(\|?[a-z0-9_:,]+)';

// Divisor entre validaciones definidas por campo ej. required|min:3
Validator.prototype.reg = '\|';




/*  Funciones de validación */

Validator.prototype.functions = {

	/*
	 * Función que valida si está vacio.
	 *  
	 * @return boolean, true si no lo está, false si lo está 
	 */
	'required': function (obj){

		if (typeof obj == 'undefined' || obj === null || obj === '') return false;
		if (typeof obj == 'number' && isNaN(obj)) return false;
		if (obj instanceof Date && isNaN(Number(obj))) return false;
		return true;
	}


	/*
	 * Función que valida si el valor como minimo tiene ciertos caracteres.
	 *
	 * @return boolean, true si no lo está, false si lo está 
	 */
	, 'min' : function (value, extras){
		min = parseInt(extras);

		if(!this.number(value))
			return value.length >= min;
		else{
			value = parseInt(value);
			return value >= min;
		}
	}



	/*
	 * Función que valida si el valor tiene como maximo ciertos caracteres.
	 *
	 * @return boolean, true si no lo está, false si lo está 
	 */
	, 'max': function (value, extras){
		max = parseInt(extras);

		// console.log(value,extras);

		if(!this.number(value))
			return value.length <= max;
		else{
			value = parseInt(value);
			return value >= max;
		}
	}




	/*
	 * Función para validar la expresión regular pasada por parametro.
	 *
	 * @return boolean, true si no lo está, false si lo está 
	 */

	, 'regexp': function (value, extras){

		var modifer = '', reg = '';

		// console.log(extras);
		/*
		if(extras.indexOf(',') != -1){
			param = extras.split(',');
			reg = param[0];
			modifer = param[1];
		}else{
		}*/
			reg = extras;

		value +="";

		if(modifer != '')
			exp = new RegExp(reg, modifer);
		else
			exp = new RegExp(reg);

		return exp.exec(value) ? true : false;
	}




	/*
	 * Función que valida si el valor es un correo electronico.
	 *
	 * @return boolean, true si no lo está, false si lo está 
	 */
	,email: function (value){
		return /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(value);
	}



	/*
	 * Función que valida si el valor es un número.
	 *
	 * @return boolean, true si no lo está, false si lo está 
	 */
	,'number': function (value){
		value += "";
		return /^\+?(0|[1-9]\d*)$/.test(value);
	}



	/*
	 * Función que valida si el valor está dentro de los valores pasados por parametro.
	 *
	 * @return boolean. true, si no lo está. false, si lo está. 
	 */
	 , 'in': function (value, extras){
	 	var param = extras.split(',');

	 	for (var i = param.length - 1; i >= 0; i--) {
	 		if(param[i] == value){
	 			return true;
	 		}
	 	};

	 	return false;

	 }



	/*
	 * Función que valida si el valor no está dentro de los valores pasados por parametro.
	 *
	 * @return boolean, true si no lo está, false si lo está 
	 */
	 , 'not_in': function (value, extras){
	 	return !this.in(value,extras);
	 }


	/*
	 * Función que valida el password.
	 * 
	 * @param pass, la contraseña enviada
	 * @param pass_conf, la contraseña de confirmación con la que se debe comparar
	 *
	 * @return boolean, true si son iguales, false si no lo son 
	 */
	 , 'password': function (pass, ex, data){
	 	return pass == data['password_confirmation'];
	 }


};




/*
 * Función que extrae las reglas.
 *
 * @return Array.
 */
Validator.prototype.getRules = function (rules){

	// console.log(rules)

	// Valido la información enviada
	if(typeof rules !== 'string' && rules == null )
		throw new Error('Error with rules');

	var rules = rules.split(this.reg); 
	var _rules = [];

	for(var r in rules ){
		_rules.push(rules[r]);
	}

	return _rules;
};



/*
 * Función para obtener el mensaje de error del campo almacenado en ini.
 *
 * @return Array.
 */
Validator.prototype.getMessages = function (ini, messages){

	// Valido la información enviada
	if(typeof messages !== 'string' && messages == null )
		throw new Error('Error with messages');

	var _messages = {};

	for(var r in messages ){ // Recorro todos los mensajes
		// Si el indice del array tiene la siguiente convención, nombre.required, los separo
		if(r.indexOf('.') != -1){
			if( this.strLeft(r,'.') == ini)
				_messages[this.strRight(r,'.')] = messages[r];
		}
	}

	return _messages;
};



/*
 * Función que pasa los parametros pasado al validador al mensaje.
 * 
 * ej. 'nombre': 'min:3';
 *	   'min' : 'debe tener mas de :min caracteres'
 *     * al pasar esto por esta función, quedaría:
 * 	   'debe tener mas de 3 caracteres'	
 *
 * @return String
 */
Validator.prototype.replaceMessage = function (mess, extras){

	if(!mess)
		return 'Existe un error en el campo.';

	if(extras.indexOf(',') == -1)
		return mess.replace(/:[a-z]+/g, extras);
	else{
		var param = extras.split(',');

		for (var i = 0; i < param.length; i++) {
			mess = mess.replace(':'+(i+1), param[i]);
		};

		return mess;
	}

};





/*
 * Función que almacena los campos de un form en un Objeto.
 * 
 * @return Object 
 */
Validator.prototype.serializeJSON = function (id){

	var o={};

	if(typeof $ != 'undefined' || typeof jQuery != 'undefined'){
		_$ = $ || jQuery;

		var a = _$(id).serializeArray();
	    
	    $.each(a,function(){
	        if(o[this.name]){
	            if(!o[this.name].push){
	                o[this.name]=[o[this.name]];
	            }
	            o[this.name].push(this.value||"");
	            
	        }else{
	            o[this.name] = this.value||"";
	            
	        }
	        
	    });

	}else{

		if(data.indexOf('#') != -1)
			form = document.getElementById(id);
		else if(data.indexOf('.') != -1)
			form = document.getElementByClassName(data);

		for(var i = 0; i < form.elements.length; i++){
		    o[form[i].getAttribute('name')] = form[i].value;
		}
	}
	

	return o;

}







/*
 * Función que retorna el resultado de la validación.
 *
 * @return boolean. true, si existen errores. false, si todo fue válid.
 */
Validator.prototype.fails = function (){
	return Object.keys(this.response).length > 0;
};




/*
 * Función que retorna los errores generados por la validación.
 *
 * @return Array
 */
Validator.prototype.errors = function (){
	return this.response;
};



/*
 * Función que retorna los errores en Arreglo.
 *
 * @return Array
 */
Validator.prototype.errorsToArray = function (){
	var a = [];
	for(var i in this.response){
	    if(typeof this.response[i] == 'string')
	        a.push(this.response[i]);
	}
	
	return a;
};



/* Funciones Extra */

Validator.prototype.strLeft = function (value, needle){
	if( typeof value !== 'string' ) return null;
	if( typeof needle !== 'string' ) return null;
	return value.substr( 0, value.indexOf(needle) );
};

Validator.prototype.strRight = function (value, needle){
	if( typeof value !== 'string' ) return null;
	if( typeof needle !== 'string' ) return null;
	return value.substr( value.indexOf(needle)+1, value.length );
};


/*
	Validator.attach = function(a) {
		'use strict';
		console.log(a);
		return new Validator();
	};
*/


/* Dependiendo del entorno de trabajo, el plugin se adapta */

if (typeof define !== 'undefined' && define.amd) {
	// AMD..
	define(function() {
		'use strict';
		return Validator;
	});
} else if (typeof module !== 'undefined' && module.exports) {
	// Node
	module.exports = Validator;
} else {
	// A pelo ^_^
	window.Validator = Validator;
}
