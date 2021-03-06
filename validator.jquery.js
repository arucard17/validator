/* =====================================================================================
    * Plugin para la validación de los campos.
    *
    * The MIT License (MIT)
    * Copyright (c) 2014 @_cristianace
    * 
    * Permission is hereby granted, free of charge, to any person obtaining a copy
    * of this software and associated documentation files (the "Software"), to deal
    * in the Software without restriction, including without limitation the rights
    * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    * copies of the Software, and to permit persons to whom the Software is
    * furnished to do so, subject to the following conditions:
    * 
    * The above copyright notice and this permission notice shall be included in all
    * copies or substantial portions of the Software.
    * 
    * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    * SOFTWARE.
    *
    * @autor @_cristianace
    * @version 0.0.4
   ====================================================================================== */


;(function($, document, window, undefined) {

    $.fn.validator = function(opts) {

        var defaults = {
            rules: {},
            messages: {},
            success: function (data){},
            fail: function ($el, messages){},
            done: function ($el){},
            failSubmit: function (messages){},

            // Divisor de validaciones definidas por campo ej. required|min:3
            reg : '\|'
        };

       /**
        * Funciones de validación
        *
        * Para extender las funciones y querer usar las nuestras propias, se debe definir de la siguiente forma:
        * En la configuración de nuestro plugin se debe agregar un atributo funciones de tipo objeto y en el 
        * colocar las funciones que queremos usar para nuestra validación, el plugin lo que hace es unir las 
        * funciones, si hay una con el mismo nombre se reemplaza, teniendo como prioridad la del usuario.
        * e.j.
        *   $('.form-horizontal').validator({
        *       functions: {
        *           dash: function (value, extras, data){
        *               exp = new RegExp('^([a-zA-Z0-9_]+)$');
        *               return exp.exec(value) ? true : false;
        *           }
        *      },
        *      ....
        * 
        */
        var functions = {

            /*
             * Función que valida si está vacío.
             *
             * @return boolean, true si no lo está, false si lo está
             */
            'required': function(obj) {

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
            ,'min': function(value, extras) {
                min = parseInt(extras);

                if (!this.number(value))
                    return value.length >= min;
                else {
                    value = parseInt(value);
                    return value >= min;
                }
            }



            /*
             * Función que valida si el valor tiene como maximo ciertos caracteres.
             *
             * @return boolean, true si no lo está, false si lo está
             */
            ,'max': function(value, extras) {
                max = parseInt(extras);

                if (!this.number(value))
                    return value.length <= max;
                else {
                    value = parseInt(value);
                    return value >= max;
                }
            }




            /*
             * Función para validar la expresión regular pasada por parametro.
             *
             * @return boolean, true si no lo está, false si lo está
             */
            ,'regexp': function(value, extras) {

                var modifer = '',
                    reg = '';

                reg = extras;

                value += "";

                if (modifer != '')
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
            ,email: function(value) {
                return /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(value);
            }



            /*
             * Función que valida si el valor es un número.
             *
             * @return boolean, true si no lo está, false si lo está
             */
            ,'number': function(value) {
                value += "";
                return /^\+?(0|[1-9]\d*)$/.test(value);
            }



            /*
             * Función que valida si el valor está dentro de los valores pasados por parametro.
             *
             * @return boolean. true, si no lo está. false, si lo está.
             */
            ,'in': function(value, extras) {
                var param = extras.split(',');

                for (var i = param.length - 1; i >= 0; i--) {
                    if (param[i] == value) {
                        return true;
                    }
                };

                return false;

            }



            /*
             * Función que valida si el valor no está dentro de los valores pasados por parametro. Depende de la función in
             *
             * @return boolean, true si no lo está, false si lo está
             */
            ,'not_in': function(value, extras) {
                return !this.in(value, extras);
            }


            /*
             * Función que valida el password.
             *
             * @param pass, la contraseña enviada
             * @param pass_conf, la contraseña de confirmación con la que se debe comparar
             *
             * @return boolean, true si son iguales, false si no lo son
             */
            ,'password': function(value, extras, data) {
                return value === data['password'];
            }

            /**
             * Función que valida el tamaño minimo y maximo de una cadena.
             * @param  {String} value
             * @param  {String} extras
             * @param  {Array} data
             * @return {boolean} true si está dentro del limite y false si no lo está
             */
            ,'between': function(value, extras, data) {
                extras = extras.split(',');
                if(extras.length == 2)
                    return this.min(value, extras[0]) && this.max(value,extras[1]);
                else
                    return false;
            }

        };


        // Se establecen las opciones que quedan para iniciar la validación
        op = $.extend({}, defaults, opts);

        // Si se definieron Funciones, amplio las existentes con las definidas por el usuario
        op.functions = $.extend({}, functions, opts.functions);

        /* The Magic */
        return this.each(function() {

            var $this = $(this),
                data = {},
                response = {};

            // Si las reglas no se definieron desde las opciones, intento obtenerlas desde el elemento en el DOM por medio del data-rules
            if(Object.keys(op.rules).length <= 0){
                op.rules = getRulesFromElements();
            }

            // Valido las reglas enviadas por el usuario
            if (typeof op.rules !== 'object' && op.rules == null)
                throw new Error('Error with rules submitted');

            // Valido las reglas enviadas por el usuario
            if (typeof op.messages !== 'object' && op.messages == null)
                throw new Error('Error with messages submitted');


            // Change Context
            op.success = $.proxy(op.success, this);
            op.fail = $.proxy(op.fail, this);
            op.failSubmit = $.proxy(op.failSubmit, this);

            update();


            // Form On Submit
            $this.submit(validar);

            // Asignar los manejadores de eventos a los elementos
            attachEvents();

            function validar (e) {
                e.preventDefault();

                response = {};

                var ruls = {},
                    mess = {},
                    _data = false;


                // Validación 
                for (var index in data) {

                    if (typeof op.rules[index] == 'undefined')
                        continue;

                    // Obtengo las reglas del campo
                    ruls = getRules(op.rules[index]);

                    // Obtengo los mensajes del campo
                    mess = getMessages(index, op.messages);

                    _data = singleValide( data[index], ruls, mess)

                    if(_data.length > 0){
                        response[index] =  _data;
                    }

                }

                if(fails()){
                    if(typeof op.failSubmit == 'function'){
                        op.failSubmit(response);
                    }
                }else{
                    if(typeof op.success == 'function'){                        
                        op.success(data);
                    }
                }
            }


            function update(){
                data = serializeJSON();
            }


            function singleValide (_data, ruls, mess) {

                var resp = [],
                    rule = '',
                    values = '',
                    extra = '',
                    _is = false,
                    _mess = {};

                for (var i = 0; i < ruls.length; i++) {

                    rule = '';
                    values = '';
                    extra = '';

                    if (ruls[i].indexOf(':') != -1) {
                        rule = strLeft(ruls[i], ':');
                        extra = strRight(ruls[i], ':');
                    } else
                        rule = ruls[i];

                    values = _data;

                    // Verifico si la regla existe
                    if (typeof op.functions[rule] === 'function') {

                        _is = op.functions[rule](values, extra, data);

                        if (!_is) {

                            // Verifico si el campo posee un mensaje en especial, si no cargo el mensaje en general para la regla
                            _mess = typeof mess[rule] == 'string' ? mess[rule] : op.messages[rule];

                            // Almaceno los mensajes en arreglos por si el campo tiene varias reglas
                            resp.push(replaceMessage(_mess, extra));
                        }
                    }
                }
                return resp;
            }


            function attachEvents () {
                var $el = {};
                 for(var i in  data){
                    $el = $('[name='+ i +']', $this);
                    $el.on('change', onChangeElement);

                    if($el.is('input') || $el.is('textarea')){
                        $el.on('blur', onChangeElement);
                    } 
                }
            }


            function onChangeElement(e){
                
                var $el = $(e.currentTarget),
                    name = $el.attr('name');

                update();

                var rules = getRules(op.rules[name]);
                var mess = getMessages(name, op.messages);
                var _data = $el.val();

                var _mess = singleValide(_data, rules, mess);

                if( _mess.length > 0 ){
                    if(typeof op.fail == 'function')
                        op.fail($el, _mess);
                }else{
                    if(typeof op.done == 'function')
                        op.done($el);
                }
            }


            /**
             * Función para obtener las reglas definidas en data-rules en cada 
             * elemento del formulario
             */
            function getRulesFromElements(){
                var elements = $this.serializeArray();
                var rules = {};

                for(var i in elements){
                    $el = $('[name='+elements[i].name+']'); 
                    if($el.length > 0){
                        if($el.data('rules') !== undefined){
                            rules[elements[i].name] = $el.data('rules');
                        }
                    }
                }
                return rules;
            }


            /*
             * Función que extrae las reglas.
             *
             * @return Array.
             */
             
            function getRules(rules) {

                // Valido la información enviada
                if (typeof rules !== 'string' && rules == null)
                    throw new Error('Error with rules');

                var rules = rules.split(op.reg);
                var _rules = [];

                for (var r in rules) {
                    _rules.push(rules[r]);
                }

                return _rules;
            };



            /*
             * Función para obtener el mensaje de error del campo almacenado en ini.
             *
             * @return Array.
             */
            function getMessages(ini, messages) {

                // Valido la información enviada
                if (typeof messages !== 'string' && messages == null)
                    throw new Error('Error with messages');

                var _messages = {};

                for (var r in messages) { // Recorro todos los mensajes
                    // Si el indice del array tiene la siguiente convención, nombre.required, los separo
                    if (r.indexOf('.') != -1) {
                        if (strLeft(r, '.') == ini)
                            _messages[strRight(r, '.')] = messages[r];
                    }
                }

                return _messages;
            };



            /*
             * Función que pasa los parametros pasado al validador al mensaje.
             *
             * ej. 'nombre': 'min:3';
             *     'min' : 'debe tener mas de :min caracteres'
             *     * al pasar esto por esta función, quedaría:
             *     'debe tener mas de 3 caracteres'
             *
             * @return String
             */
            function replaceMessage(mess, extras) {

                if (!mess)
                    return 'Existe un error en el campo.';

                if (extras.indexOf(',') == -1)
                    return mess.replace(/:[a-z]+/g, extras);
                else {
                    var param = extras.split(',');

                    for (var i = 0; i < param.length; i++) {
                        mess = mess.replace(':' + (i + 1), param[i]);
                    };

                    return mess;
                }

            };





            /*
             * Función que almacena los campos de un form en un Objeto.
             *
             * @return Object
             */
            function serializeJSON() {

                var o = {};

                var a = $this.serializeArray();

                $.each(a, function() {
                    if (o[this.name]) {
                        if (!o[this.name].push) {
                            o[this.name] = [o[this.name]];
                        }
                        o[this.name].push(this.value || "");

                    } else {
                        o[this.name] = this.value || "";

                    }

                });

                return o;

            }




            /*
             * Función que retorna el resultado de la validación.
             *
             * @return boolean. true, si existen errores. false, si todo fue válid.
             */
            function fails() {
                return Object.keys(response).length > 0;
            };




            /*
             * Función que retorna los errores generados por la validación.
             *
             * @return Array
             */
            function errors() {
                return this.response;
            };



            /*
             * Función que retorna los errores en Arreglo.
             *
             * @return Array
             */
            function errorsToArray() {
                var a = [];
                for (var i in this.response) {
                    if (typeof this.response[i] == 'string')
                        a.push(this.response[i]);
                }

                return a;
            };



            /* Funciones Extra */

            function strLeft(value, needle) {
                if (typeof value !== 'string') return null;
                if (typeof needle !== 'string') return null;
                return value.substr(0, value.indexOf(needle));
            };

            function strRight(value, needle) {
                if (typeof value !== 'string') return null;
                if (typeof needle !== 'string') return null;
                return value.substr(value.indexOf(needle) + 1, value.length);
            };


        });

    }

})(jQuery, document, window, undefined);

