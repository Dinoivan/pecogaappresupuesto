
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], function (Controller, MessageToast) {
    "use strict";

    return Controller.extend("pecogaappresupuesto.controller.Main", {

        _getZeros: function (x) {
            var zero;
            if (10 - x.length === 3) {
                zero = "000";
            } else if (10 - x.length === 2) {
                zero = "00";
            }
            return zero;
        },

     
        formatMoney: function (value) {
            if (value == null || isNaN(value)) {
                return ""; // Manejo de valores nulos o inválidos
            }
        
            // Formatear el número con coma como separador de miles y punto para decimales
            return new Intl.NumberFormat("en-US", {
                style: "decimal",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(value);
        },

                formatCostAssignment: function(accountCategory, accountDesc, accountNumber, glAccountDesc, glAccountNumber) {
                    debugger
                    console.log("accountCategory:", accountCategory);
                    console.log("accountDesc:", accountDesc);
                    console.log("accountNumber:", accountNumber);
                    console.log("glAccountDescription:", glAccountDesc);
                    console.log("glAccountNumber:", glAccountNumber);
                
                    if (accountCategory) {
                        return accountCategory + " " + accountDesc + " (" + accountNumber + ")\n" +
                            "Cuenta de mayor " + glAccountDesc + " (" + glAccountNumber + ")";
                    } else {
                        return "No asignado";
                    }
                },

                notesVisibilityTrigger: function(iNumberOfNotes) {
                    return iNumberOfNotes > 0; // Retorna `true` si es mayor a 0, `false` si es 0
                },

                attachmentsVisibilityTrigger: function(aAttachments) {
                    return aAttachments && aAttachments.length > 0;
                },

                
        splitFirstLine: function (sText) {
            if (!sText) return ""; // Si el texto está vacío
        
            if (sText.includes(":")) {
                return sText.split(":")[0] + ":"; // "Estimado(a) empleado(a):"
            }
            return sText; // Si no tiene ":", se devuelve todo el texto
        },
        
        splitRestOfText: function (sText) {
            if (!sText) return ""; // Si el texto está vacío
        
            if (sText.includes(":")) {
                return sText.split(":").slice(1).join(":").trim(); // "Consulte el documento..."
            }
            return ""; // Si no tiene ":", devuelve vacío
        },

        formatStatus: function (sStatus) {
            if (!sStatus) {
                return "";
            }
        
            var oMapping = {
                "READY": "Listo",
                "IN_PROGRESS": "En progreso",
                "COMPLETED": "Completado",
                "FAILED": "Fallido",
                "CANCELLED": "Cancelado",
                "RESERVED": "Reservado"
            };
        
            return oMapping[sStatus] || sStatus; // Devuelve el valor traducido o el original si no está en el mapping
        },

        formatPriority: function (sPriority) {
            if (!sPriority) {
                return "";
            }

            var oMapping = {
                "HIGH": "Alto",
                "MEDIUM": "Medio",
                "LOW": "Bajo"
            };

            return oMapping[sPriority.toUpperCase()] || sPriority.toLowerCase();
        },

        formatDate: function(sDate) {
            if (!sDate) {
                return "";
            }
            
            // Convertir la fecha en objeto Date
            var oDate = new Date(sDate);
            
            // Opciones de formato
            var oOptions = {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            };

            // Formatear fecha
            var sFormattedDate = oDate.toLocaleDateString("es-ES", oOptions);

            return "Creado el " + sFormattedDate.replace(",", "");
        },


        setUrlBase: function(url){
			sessionStorage.setItem("urlBase", url);
		},
        getUrlBase: function () {
			var remoto = sessionStorage.getItem("urlBase");
			return remoto;
		},
        
        onInit: function () {
            // SER URL BASE
            const orderRoute = this.getOwnerComponent().getRouter().getRoute("RouteMain");
            orderRoute.attachPatternMatched(this.onPatternMatched, this);
            this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            this.setUrlBase(this.oRouter._oOwner._oManifest._oBaseUri._parts.path);

            this.sendBatchRequest();
        },

        onPatternMatched: function(){
            
            this.setFooterDetail();
            
        },

        onAfterRendering: function () {
            debugger
            var that = this;
            var oModel = that.getOwnerComponent().getModel("AppData");
        
            if (!oModel) {
                console.warn("El modelo AppData aún no está disponible. Esperando carga...");
                that.getOwnerComponent().getModel().attachRequestCompleted(function () {
                    console.log("El modelo AppData ahora está disponible.");
                    that._selectFirstItem();
                });
                return;
            }
            
            that._selectFirstItem();
        },
        
        _selectFirstItem: function () {
            var oList = this.getView().byId("list");
            if (!oList) {
                console.error("No se encontró la lista.");
                return;
            }
        
            var oItems = oList.getItems();
            if (oItems.length > 0) {
                oList.setSelectedItem(oItems[0], true);
                console.log("Elemento seleccionado: ",oItems[0]);
                 // Obtener el contexto de datos
                var oContext = oItems[0].getBindingContext("AppData");
                debugger
                if (oContext) {
                    console.log("Contexto del elemento seleccionado:", oContext.getObject());
                   console.log("Modelo 'header' actualizado con la primera tarea.");
                } else {
                    console.warn("No hay contexto en el elemento seleccionado.");
                }
                this.fireSelectionChange({ getSource: () => oList });
            } else {
                console.warn("La lista no tiene elementos.");
            }
        },

        sendBatchRequest: function () {

            debugger

            var oModel = this.getOwnerComponent().getModel();

            console.log("Modelo: ",oModel);

            oModel.setUseBatch(true); 
        
            // Crear un batch group ID
            var sBatchGroupId = "batchRequestGroup";
        
            var mParameters1 = {
                groupId: sBatchGroupId,
                urlParameters: {},
                success: function (oData) {
                    console.log("Datos de FilterOptionCollection:", oData);
                    this.FilterOptions = oData.results;
                }.bind(this),
                error: function (oError) {
                    console.error("Error en FilterOptionCollection:", oError);
                }
            };
        
            var mParameters2 = {
                groupId: sBatchGroupId,
                filters: [
                    new sap.ui.model.Filter("ConsumerType", sap.ui.model.FilterOperator.EQ, "TABLET"),
                    new sap.ui.model.Filter("UniqueName", sap.ui.model.FilterOperator.EQ, "TS_FM")
                ],
                success: function (oData) {
                    console.log("Datos de ConsumerScenarioCollection:", oData);
                    this.ConsumerScenarios = oData.results;
                }.bind(this),
                error: function (oError) {
                    console.error("Error en ConsumerScenarioCollection:", oError);
                }
            };
        
            var mParameters3 = {
                groupId: sBatchGroupId,
                urlParameters: { "$expand": "CustomAttributeDefinitionData" },
                success: function (oData) {
                    console.log("Datos de TaskDefinitionCollection:", oData);
                    this.TaskDefinitions = oData.results;
                }.bind(this),
                error: function (oError) {
                    console.error("Error en TaskDefinitionCollection:", oError);
                }
            };
        
            var mParameters4 = {
                groupId: sBatchGroupId,
                urlParameters: {
                    "$skip": 0,
                    "$top": 100,
                    "$orderby": "CreatedOn desc",
                    "$filter": "TaskDefinitionID eq 'TS90300006' and SAP__Origin eq 'LOCAL_PGW' and (Status eq 'READY' or Status eq 'RESERVED' or Status eq 'IN_PROGRESS' or Status eq 'EXECUTED')",
                    "$select": "SAP__Origin,InstanceID,TaskDefinitionID,TaskDefinitionName,TaskTitle,CreatedByName,CreatedBy,CompletionDeadLine,SubstitutedUserName,Status,Priority,PriorityNumber,HasComments,HasAttachments,HasPotentialOwners,CreatedOn,TaskSupports,SupportsClaim,SupportsRelease,SupportsForward,SupportsComments,SupportsAttachments",
                    "$inlinecount": "allpages"
                },
                success: function (oData) {
                    console.log("Datos de TaskCollection:", oData);
                    console.log("Datos de result: ", oData.results);
                    this.Tasks = oData.results;
                    this.createAppDataModel();
                }.bind(this),
                error: function (oError) {
                    console.error("Error en TaskCollection:", oError);
                }
            };

            //Deben ser colocados en otra parte

            // var mParameters5 = {
            //     groupId: sBatchGroupId,
            //     urlParameters: {
            //         "SAP__Origin": "'LOCAL_PGW'", 
            //         "InstanceID": "'000007708006'"
            //     },
            //     success: function (oData) {
            //         console.log("Datos de DecisionOptions:", oData);
            //         console.log("Datos de result: ", oData.results);
            //         this.DecisionOptions = oData.results;
            //     }.bind(this),
            //     error: function (oError) {
            //         console.error("Error en DecisionOptions:", oError);
            //     }
            // };

            // var mParameters6 = {
            //     groupId: sBatchGroupId,
            //     urlParameters: {
            //         "SAP__Origin": "LOCAL_PGW",
            //         "InstanceID": "000007708006"
            //     },
            //     success: function (oData) {
            //         console.log("Datos de UIExecutionLinkCollection:", oData);
            //         this.UIExecutionLinks = oData;
            //     }.bind(this),
            //     error: function (oError) {
            //         console.error("Error en UIExecutionLinkCollection:", oError);
            //     }
            // };

            //  // Nueva solicitud: Obtener detalles de TaskCollection con expansión
            //     var mParameters7 = {
            //         groupId: sBatchGroupId,
            //         urlParameters: {
            //             "$expand": "Description,CustomAttributeData",
            //             "$select": "Description,CustomAttributeData,Status,TaskTitle"
            //         },
            //         success: function (oData) {
            //             console.log("Datos de TaskCollection con expansión:", oData);
            //             this.TaskCollectionExpanded = oData;
            //         }.bind(this),
            //         error: function (oError) {
            //             console.error("Error en TaskCollection con expansión:", oError);
            //         }
            //     };

            //     // Nueva solicitud: Contar los comentarios de la tarea
            //     var mParameters8 = {
            //         groupId: sBatchGroupId,
            //         success: function (oData) {
            //             console.log("Cantidad de comentarios:", oData);
            //             this.CommentCount = oData;
            //         }.bind(this),
            //         error: function (oError) {
            //             console.error("Error al obtener el conteo de comentarios:", oError);
            //         }
            //     };

            //     // Nueva solicitud: Contar los adjuntos de la tarea
            //     var mParameters9 = {
            //         groupId: sBatchGroupId,
            //         success: function (oData) {
            //             console.log("Cantidad de adjuntos:", oData);
            //             this.AttachmentCount = oData;
            //         }.bind(this),
            //         error: function (oError) {
            //             console.error("Error al obtener el conteo de adjuntos:", oError);
            //         }
            //     };

            //     // Nueva solicitud: Contar los objetos de la tarea
            //     var mParameters10 = {
            //         groupId: sBatchGroupId,
            //         success: function (oData) {
            //             console.log("Cantidad de objetos de la tarea:", oData);
            //             this.TaskObjectCount = oData;
            //             this.createAppDataModel();
            //             // this._selectFirstItem(); 
            //         }.bind(this),
            //         error: function (oError) {
            //             console.error("Error al obtener el conteo de objetos de la tarea:", oError);
            //         }
            //     };

            

                // Agregar las solicitudes al batch
                oModel.read("/FilterOptionCollection", mParameters1);
                oModel.read("/ConsumerScenarioCollection", mParameters2);
                oModel.read("/TaskDefinitionCollection", mParameters3);
                oModel.read("/TaskCollection", mParameters4);

                // oModel.read("/DecisionOptions", mParameters5);
                // oModel.read("/TaskCollection(SAP__Origin='LOCAL_PGW',InstanceID='000007708006')/UIExecutionLink", mParameters6);
                // oModel.read("/TaskCollection(SAP__Origin='LOCAL_PGW',InstanceID='000007708006')", mParameters7);
                // oModel.read("/TaskCollection(SAP__Origin='LOCAL_PGW',InstanceID='000007708006')/Comments/$count", mParameters8);
                // oModel.read("/TaskCollection(SAP__Origin='LOCAL_PGW',InstanceID='000007708006')/Attachments/$count", mParameters9);
                // oModel.read("/TaskCollection(SAP__Origin='LOCAL_PGW',InstanceID='000007708006')/TaskObjects/$count", mParameters10);
            },
        
        
        createAppDataModel: function () {

            var oModel = new sap.ui.model.json.JSONModel({
                FilterOptions: this.FilterOptions || [],
                ConsumerScenarios: this.ConsumerScenarios || [],
                TaskDefinitions: this.TaskDefinitions || [],
                Tasks: this.Tasks || [],
                TasksCount: this.Tasks ? this.Tasks.length : 0,
                // DecisionOptions: this.DecisionOptions || [],
                // UIExecutionLinks: this.UIExecutionLinks || [],
                // TaskCollectionExpanded: this.TaskCollectionExpanded || [],
                // CommentCount: this.CommentCount ? this.CommentCount.length: 0,
                // AttachmentCount: this.AttachmentCount || [],
                // TaskObjectCount: this.TaskObjectCount || []

            });
        
            this.getOwnerComponent().setModel(oModel, "AppData"); // Guardar el modelo global
            sap.m.MessageToast.show("✅ Datos cargados correctamente");
            console.log("Modelo AppData:", oModel.getData()); // Verificar en consola
        },

        onSortPress: function (oEvent) {
            var oButton = oEvent.getSource();
            if (!this._oSortMenu) {
                this._oSortMenu = new sap.m.Menu({
                    items: [
                        new sap.m.MenuItem({
                            text: "Creado por (A en la parte superior)",
                            press: this.onSortByCreatedBy.bind(this)
                        }),
                        new sap.m.MenuItem({
                            text: "Prioridad (La prioridad más alta en la parte superior)",
                            press: this.onSortByPriority.bind(this)
                        }),
                        new sap.m.MenuItem({
                            text: "Título (A en la parte superior)",
                            press: this.onSortByTitle.bind(this)
                        }),
                        new sap.m.MenuItem({
                            text: "Fecha de creación (las más nuevas en la parte superior)",
                            press: this.onSortByCreatedDate.bind(this)
                        }),
                        new sap.m.MenuItem({
                            text: "Fecha de vencimiento (las más recientes en la parte superior)",
                            press: this.onSortByDueDate.bind(this)
                        })
                    ]
                });
            }
            this._oSortMenu.openBy(oButton);
        },
        
        onSortByCreatedBy: function () {
            this.sortList("CreatedByName");
        },
        
        onSortByPriority: function () {
            this.sortList("Priority");
        },
        
        onSortByTitle: function () {
            this.sortList("TaskTitle");
        },
        
        onSortByCreatedDate: function () {
            this.sortList("CreatedOn");
        },
        
        onSortByDueDate: function () {
            this.sortList("DueDate");
        },
        
        sortList: function (sProperty) {
            var oList = this.byId("list");
            var oBinding = oList.getBinding("items");
            var oSorter = new sap.ui.model.Sorter(sProperty, false);
            oBinding.sort([oSorter]);
        },

       
        _handleItemPressDesktop: function (oEvent) {
            debugger
            console.log("_handleItemPressDesktop");

            this.getView().setBusyIndicatorDelay(0);
            this.getView().setBusy(true);
       
            // Obtener el item correcto
            var item;
            if (oEvent.getId() === "select") {
                item = oEvent.getParameter("listItem");
                console.log("Resultado de Item de lista: ",item);
            } else {
                item = oEvent.getSource();
                console.log("Resultado de Item del contexto global: ",item);
            }
        
            // Validar que item sea un ObjectListItem antes de continuar
            console.log("Resultado de Item del contexto global: ",item instanceof sap.m.ObjectListItem);
            if (!(item instanceof sap.m.ObjectListItem)) {
                this.getView().setBusy(false);
                console.error("El evento no proviene de un ObjectListItem.");
                return;
            }
        
            var oItem = item.getBindingContext("AppData");

            console.log("Resultado del item: ",oItem);

            var itemSeleccionado = oItem.getObject();

            if (oItem) {
                console.log("Contexto del elemento seleccionado:", oItem.getObject());
                this.getView().setBusy(false);
            }
            if (!oItem) {
                this.getView().setBusy(false);
                console.error("No se encontró un objeto válido en el contexto.");
                return;
            }
        
            // Actualizar modelo "header"
             this.getView().setModel(new sap.ui.model.json.JSONModel(itemSeleccionado), "header");

             // Obtener el modelo actualizado
                var oHeaderModel = this.getView().getModel("header");

                // Obtener los datos del modelo
                var oHeaderData = oHeaderModel.getData();

                // Imprimir en consola
                console.log("Modelo 'header' actualizado:", oHeaderData);

                var sSAPOrigin = itemSeleccionado.SAP__Origin.trim();
                var sInstanceID = itemSeleccionado.InstanceID.trim();

                console.log("Origen: ",sSAPOrigin);
                console.log("IDD: ", sInstanceID);

                this.fetchTaskData(sSAPOrigin,sInstanceID);

                    // Definir el servicio OData
                        var oDataModel = new sap.ui.model.odata.v2.ODataModel(this.getUrlBase() + "sap/opu/odata/sap/Z_FM_FM_GET_DOC_PRESUPUESTO_V7_SRV");

                        console.log("Modelo oDataModel: ", oDataModel);

                        // Definir la entidad con los filtros
                        var sEntity = `/DocPresupuestoSet(Wid='${sInstanceID}')`;

                        // Definir parámetros de expansión
                        var mParameters = {
                            urlParameters: {
                                "$expand": "EtDetalle,EtTextoCab"
                            },
                            success: function (oDocData) {
                                console.log("Datos recibidos correctamente:", oDocData);
                            
                                // Verificar si `EtDetalle.results` es un array antes de asignarlo
                                if (!oDocData.EtDetalle || !Array.isArray(oDocData.EtDetalle.results)) {
                                    console.warn("⚠️ Advertencia: 'EtDetalle.results' no es un array. Se asignará un array vacío.");
                                    oDocData.EtDetalle = { results: [] };
                                }

                                      // Guardar los datos de DocPresupuesto en un modelo separado "DocPresupuestoModel"
                                    var oDocPresupuestoModel = new sap.ui.model.json.JSONModel(oDocData);
                                    this.getView().setModel(oDocPresupuestoModel, "DocPresupuestoModel");

                                    console.log("Modelo 'DocPresupuestoModel' actualizado:", oDocPresupuestoModel.getData());
                                this.getView().setBusy(false);
                            }.bind(this),
                            error: function (oError) {
                                console.error("❌ Error en la petición OData:", oError);
                                this.getView().setBusy(false);
                            }.bind(this)
                        };

                        // Llamada al servicio OData
                        oDataModel.read(sEntity, mParameters)

        },

        fetchTaskData: function (sSAPOrigin, sInstanceID) {
            var that = this; // Guardar el contexto para usar dentro de las funciones
            this.getView().setBusy(true); // Mostrar indicador de carga
        
            // Construcción de la URL base para TaskCollection
            var sServiceUrl = this.getView().getModel().sServiceUrl;
            var sQuery = `/TaskCollection(SAP__Origin='${sSAPOrigin}',InstanceID='${sInstanceID}')`;
            var sFullUrl = sServiceUrl + sQuery;
        
            console.log("🔍 URL base de la petición:", sFullUrl);
        
            // Parámetros OData
            var oParams = {
                "$expand": "Description,CustomAttributeData",
                "$select": "Description,CustomAttributeData,Status,TaskTitle"
            };
        
            var sUrlWithParams = sFullUrl + "?" + $.param(oParams);
            console.log("🔍 URL con parámetros (TaskCollection):", sUrlWithParams);
        
            var aPromises = [
                // Obtener la información principal de la tarea
                $.ajax({
                    url: sUrlWithParams,
                    type: "GET",
                    dataType: "json",
                    contentType: "application/json",
                    headers: { "Accept": "application/json" }
                }).then(function (oData) {
                    console.log("📌 Datos de TaskCollection recibidos:", oData);
                    return { TaskData: oData };
                }),
        
                // Obtener opciones de decisión (estructura corregida)
                (function () {
                    var sQuery = `/DecisionOptions`;
                    var oDecisionParams = {
                        "SAP__Origin": `'${sSAPOrigin}'`,
                        "InstanceID": `'${sInstanceID}'`
                    };
        
                    var sFullUrl = `${sServiceUrl}${sQuery}?` + $.param(oDecisionParams);
                    console.log("🔍 URL con parámetros (DecisionOptions):", sFullUrl);
        
                    return $.ajax({
                        url: sFullUrl,
                        type: "GET",
                        dataType: "json",
                        contentType: "application/json",
                        headers: { "Accept": "application/json" }
                    }).then(function (oData) {
                        console.log("📌 Datos de DecisionOptions recibidos:", oData);
                        return { DecisionOptions: oData };
                    }).catch(function (oError) {
                        console.error("❌ Error en DecisionOptions:", oError);
                        return { DecisionOptions: [] }; // En caso de error, devolver un array vacío
                    });
                })(),
        
                // Obtener enlaces de ejecución de UI
                (function () {
                    var sQuery = `/TaskCollection(SAP__Origin='${sSAPOrigin}',InstanceID='${sInstanceID}')/UIExecutionLink`;
                    var sFullUrl = sServiceUrl + sQuery;
                    console.log("🔍 URL con parámetros (UIExecutionLink):", sFullUrl);
        
                    return $.ajax({
                        url: sFullUrl,
                        type: "GET",
                        dataType: "json",
                        contentType: "application/json",
                        headers: { "Accept": "application/json" }
                    }).then(function (oData) {
                        console.log("📌 Datos de UIExecutionLinkCollection recibidos:", oData);
                        return { UIExecutionLinks: oData };
                    });
                })(),
        
                // Contar comentarios de la tarea
                (function () {
                    var sQuery = `/TaskCollection(SAP__Origin='${sSAPOrigin}',InstanceID='${sInstanceID}')/Comments/$count`;
                    var sFullUrl = sServiceUrl + sQuery;
                    console.log("🔍 URL con parámetros (Comments Count):", sFullUrl);
        
                    return $.ajax({
                        url: sFullUrl,
                        type: "GET",
                        dataType: "json",
                        contentType: "application/json",
                        headers: { "Accept": "application/json" }
                    }).then(function (oData) {
                        console.log("📌 Cantidad de comentarios recibida:", oData);
                        return { CommentCount: oData };
                    });
                })(),
        
                // Contar adjuntos de la tarea
                (function () {
                    var sQuery = `/TaskCollection(SAP__Origin='${sSAPOrigin}',InstanceID='${sInstanceID}')/Attachments/$count`;
                    var sFullUrl = sServiceUrl + sQuery;
                    console.log("🔍 URL con parámetros (Attachments Count):", sFullUrl);
        
                    return $.ajax({
                        url: sFullUrl,
                        type: "GET",
                        dataType: "json",
                        contentType: "application/json",
                        headers: { "Accept": "application/json" }
                    }).then(function (oData) {
                        console.log("📌 Cantidad de adjuntos recibida:", oData);
                        return { AttachmentCount: oData };
                    });
                })(),
        
                // Contar objetos de la tarea
                (function () {
                    var sQuery = `/TaskCollection(SAP__Origin='${sSAPOrigin}',InstanceID='${sInstanceID}')/TaskObjects/$count`;
                    var sFullUrl = sServiceUrl + sQuery;
                    console.log("🔍 URL con parámetros (TaskObjects Count):", sFullUrl);
        
                    return $.ajax({
                        url: sFullUrl,
                        type: "GET",
                        dataType: "json",
                        contentType: "application/json",
                        headers: { "Accept": "application/json" }
                    }).then(function (oData) {
                        console.log("📌 Cantidad de objetos de la tarea recibida:", oData);
                        return { TaskObjectCount: oData };
                    });
                })()
            ];
        
            // Ejecutar todas las promesas en paralelo
            Promise.all(aPromises)
                .then(function (results) {
                    var oTaskData = {};
        
                    // Combinar los resultados en un solo objeto
                    results.forEach(function (result) {
                        Object.assign(oTaskData, result);
                    });
        
                    // Crear y asignar el modelo "TaskModel"
                    var oTaskModel = new sap.ui.model.json.JSONModel(oTaskData);
                    that.getView().setModel(oTaskModel, "TaskModel");
        
                    console.log("📌 Modelo 'TaskModel' actualizado:", oTaskModel.getData());
        
                    sap.m.MessageToast.show("✅ Datos cargados correctamente");
                })
                .catch(function (error) {
                    console.error("❌ Error en una de las solicitudes:", error);
                })
                .finally(function () {
                    that.getView().setBusy(false); // Ocultar indicador de carga
                });
        },
        
        _handleItemPress: function (oEvent) {
            console.log("--_handleItemPress--");
            debugger
            var isPhone = this.getView().getModel("device").getData().isPhone;  
            try {
                this._handleItemPressDesktop(oEvent);
            } catch (e) {
                console.error(e);
            }
        },


        _handleSelectPress: function (oEvent) {
            /* Is this a phone */
            debugger
            console.log("_handleSelectPress", oEvent);
            var isPhone;
            isPhone = this.getView().getModel("device").getData().isPhone;
            if (isPhone) {
                //this._handleItemPressPhone(oEvent);
            } else {
                this._handleItemPress(oEvent);
            }
        },
   
        _handleSelect: function (e) {
            //console.log(e.getSource().getSelectedItems());
            console.log("_handleSelect");
            this.setListItem(e);
            if (!sap.ui.Device.system.phone) {
                this._oApplicationImplementation.oSplitContainer.hideMaster();
            }
        },

        fireSelectionChange: function (e) {
            debugger;
            console.log("fireSelectionChange ejecutado", e);
        
            var aSelectedItems = e.getSource().getSelectedItems();
            console.log("Elementos seleccionados:", aSelectedItems);
        
            if (aSelectedItems.length > 0) {
                var oLastSelectedItem = aSelectedItems[aSelectedItems.length - 1];
                console.log("Último seleccionado:", oLastSelectedItem);
        
                var oEventMock = {
                    getId: function () { return "select"; },
                    getParameter: function () { return oLastSelectedItem; },
                    getSource: function () { return e.getSource(); }
                };
        
                this._handleSelectPress(oEventMock);
            }
        },

         footerAprobarDerecha: function (oEvent) {
           this.onOpenAprobarDialog();
       
          },

          
       onOpenAprobarDialog: function () {
        if (!this.oDialog) {
            this.oDialog = sap.ui.xmlfragment("pecogaappresupuesto.view.fragment.Aprobar", this);
            this.getView().addDependent(this.oDialog);
        }
        this.oDialog.open();
            },
            onCloseDialog: function () {
                if (this.oDialog) {
                    var oTextArea = this.oDialog.getContent()[0].getItems()[2]; // Obtiene el TextArea dentro del VBox
                    if (oTextArea) {
                        oTextArea.setValue("");
                    }
                    this.oDialog.close();
                }
            },

            onConfirmAprobacion: async function () {
                try {
                    debugger
                    var sUrl = this.getUrlBase() + "sap/opu/odata/IWPGW/TASKPROCESSING;mo;v=2/";
            
                    var sNota = this.oDialog.getContent()[0].getItems()[2].getValue();
            
                    let response = await fetch(sUrl, {
                        method: "GET",
                        headers: {
                            "X-CSRF-Token": "Fetch",
                            "Accept": "application/json"
                        }
                    });
            
                    if (!response.ok) throw new Error("Error al obtener el CSRF Token");
            
                    let csrfToken = response.headers.get("X-CSRF-Token");
                    let data = await response.json();
            
                    console.log("CSRF Token obtenido:", csrfToken);
                    console.log("Respuesta del servicio:", data);
            
                    var ModeloPrincipal = this.getView().getModel('header');
                    
                    console.log("Modelo principal:", ModeloPrincipal);
            
                    var oMainData = ModeloPrincipal.getProperty("/");
                 
                    console.log("✅ Datos obtenidos del modelo 'header':", oMainData);

                    // 🚀 Forma correcta de acceder a las propiedades
                    var SAP__Origin = oMainData?.SAP__Origin || null;
                    console.log("📝 SAP ORIGIN:", SAP__Origin);

                    var InstanceID = oMainData?.InstanceID || null;
                    console.log("📌 InstanceID:", InstanceID);
        
            
                    console.log("Datos obtenidos:", InstanceID, SAP__Origin);
            
                    var postUrl = this.getUrlBase() + `sap/opu/odata/IWPGW/TASKPROCESSING;mo;v=2/Decision` +
                        `?SAP__Origin='${SAP__Origin}'&InstanceID='${InstanceID}'&DecisionKey='0001'&Comments='${encodeURIComponent(sNota || "")}'`;
        
                    let postResponse = await fetch(postUrl, {
                        method: "POST",
                        headers: {
                            "Accept": "application/json",
                            "Content-Type": "application/json",
                            "X-CSRF-Token": csrfToken 
                        }
                    });
            
                    if (!postResponse.ok) throw new Error("Error en la aprobación: " + postResponse.statusText);
            
                    let postData = await postResponse.json();
                    console.log("Respuesta del servicio Desitions:", postData);
                    sap.m.MessageToast.show("Solicitud aprobada correctamente");

                     // ✅ Volver a cargar los datos y refrescar la lista
                    await this.sendBatchRequest(); 

                    // ✅ Refrescar el modelo de la lista de tareas y seleccionar el primer elemento
                    setTimeout(() => {
                        this._selectFirstItem();
                    }, 1000);

                        
                    this.onCloseDialog();
            
                } catch (error) {
                    console.error("Error en la solicitud:", error);
                    sap.m.MessageBox.error("Error: " + error.message);
                }
            },
    

          fotterRechazarDerecha: function (oEvent) {
            this.oPenDialogoRechazar();
          
        },

        oPenDialogoRechazar: function(){
            if (!this._oDialog) {
                this._oDialog = sap.ui.xmlfragment("pecogaappresupuesto.view.fragment.Rechazar", this);
                this.getView().addDependent(this._oDialog);
            }
            this._oDialog.open();

        },

        onCloseDialogRechazar: function(){
            if (this._oDialog) {
                var oTextAreaRechazar = this._oDialog.getContent()[0].getItems()[2];
                if (oTextAreaRechazar) {
                    oTextAreaRechazar.setValue("");
                }
                this._oDialog.close();
            }

        },

        onConfirmRechazar: async function () {
            try {
                debugger
                var sUrl = this.getUrlBase() + "sap/opu/odata/IWPGW/TASKPROCESSING;mo;v=2/";
        
                var sNota = this._oDialog.getContent()[0].getItems()[2].getValue();
        
        
                let response = await fetch(sUrl, {
                    method: "GET",
                    headers: {
                        "X-CSRF-Token": "Fetch",
                        "Accept": "application/json"
                    }
                });
        
                if (!response.ok) throw new Error("Error al obtener el CSRF Token");
        
                let csrfToken = response.headers.get("X-CSRF-Token");
                let data = await response.json();
        
                console.log("CSRF Token obtenido:", csrfToken);
                console.log("Respuesta del servicio:", data);
        
                var ModeloPrincipal = this.getView().getModel('header');
                
                console.log("Modelo principal:", ModeloPrincipal);
        
                var oMainData = ModeloPrincipal.getProperty("/");
             
                console.log("Datos obtenidos del modelo 'header':", oMainData);

                // 🚀 Forma correcta de acceder a las propiedades
                var SAP__Origin = oMainData?.SAP__Origin || null;
                console.log("📝 SAP ORIGIN:", SAP__Origin);

                var InstanceID = oMainData?.InstanceID || null;
                console.log("📌 InstanceID:", InstanceID);
    
        
                console.log("Datos obtenidos:", InstanceID, SAP__Origin);
        
                var postUrl = this.getUrlBase() + `sap/opu/odata/IWPGW/TASKPROCESSING;mo;v=2/Decision` +
                    `?SAP__Origin='${SAP__Origin}'&InstanceID='${InstanceID}'&DecisionKey='0002'&Comments='${encodeURIComponent(sNota || "")}'`;
    
                let postResponse = await fetch(postUrl, {
                    method: "POST",
                    headers: {
                        "Accept": "application/json",
                        "Content-Type": "application/json",
                        "X-CSRF-Token": csrfToken 
                    }
                });
        
                if (!postResponse.ok) throw new Error("Error en la aprobación: " + postResponse.statusText);
        
                let postData = await postResponse.json();
                console.log("Respuesta del servicio Desitions:", postData);
                sap.m.MessageToast.show("Solicitud rechazada correctamente");

                 console.log("Llamado");
                 // ✅ Volver a cargar los datos y refrescar la lista
                await this.sendBatchRequest(); 

                // ✅ Refrescar el modelo de la lista de tareas y seleccionar el primer elemento
                setTimeout(() => {
                    this._selectFirstItem();
                }, 1000);

                    
                this.onCloseDialogRechazar();
        
            } catch (error) {
                console.error("Error en la solicitud:", error);
                sap.m.MessageBox.error("Error: " + error.message);
            }
        },


           
        setFooterDetail: function () {
            debugger
            console.log("Ejecutando setFooterDetail...");
        
            var page = this.getView().byId("WIDetail");
            if (!page) {
                console.log("No se encontró la página WIDetail");
                return;
            }
        
            var bar = page.getFooter();
            if (!bar) {
                bar = new sap.m.Bar();
                page.setFooter(bar);
            }
        
            console.log("Footer encontrado o creado");
        
            if (bar.getContentRight().length < 1) {
                console.log("Agregando botones al footer...");
                
                var oAprobar = new sap.m.Button({
                    text: "Aprobar presupuesto",
                    type: sap.m.ButtonType.Transparent, // Simula el estilo de enlace
                    press: this.footerAprobarDerecha.bind(this)
                });
        
                var oRechazar = new sap.m.Button({
                    text: "Rechazar presupuesto",
                    type: sap.m.ButtonType.Transparent, // Simula el estilo de enlace
                    press: this.fotterRechazarDerecha.bind(this)
                });
        
                // Crear un HBox para alinear los botones en el centro
                var oHBox = new sap.m.HBox({
                    items: [oAprobar, oRechazar],
                    justifyContent: "Start", // Centra los botones en la barra de pie de página
                    width: "100%"
                });
        
                bar.addContentMiddle(oHBox);
            
        
            }
        },
    

        
    });
});






















// sap.ui.define([
//     "sap/ui/core/mvc/Controller",
//     "sap/m/MessageToast"
// ], function (Controller, MessageToast) {
//     "use strict";

//     return Controller.extend("pecogaappresupuesto.controller.Main", {

//         // Se ejecuta cuando la vista se inicializa
//         onInit: function () {
//             // Puedes obtener el modelo configurado en el manifest.json
//             var oModel = this.getView().getModel(); // "mainService" en el manifest.json
//             // Si el modelo no está disponible, podemos hacerlo manualmente
//             if (!oModel) {
//                 oModel = new sap.ui.model.odata.v2.ODataModel("/7520b8eb-8965-460c-a6be-89666a29c948.pecogaappresupuesto.pecogaappresupuesto/~35b8e0a2-246c-4ad6-ad6b-c35132f0acaa~/sap/opu/odata/IWPGW/TASKPROCESSING;mo;v=2/", true);
//                 this.getView().setModel(oModel);
//             }

//             // Realizamos una lectura de datos (puedes personalizar la ruta de la entidad)
//             oModel.read("/TaskCollection", {
//                 success: function (oData, response) {
//                     // Procesar los datos obtenidos
//                     MessageToast.show("Datos cargados correctamente.");
//                     console.log(oData); // Aquí tienes los datos
//                 },
//                 error: function (oError) {
//                     // Manejo de errores
//                     MessageToast.show("Error al cargar los datos.");
//                     console.error(oError);
//                 }
//             });
//         }
//     });
// });