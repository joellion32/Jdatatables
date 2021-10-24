/*
JDatatables
Creada por Joel A. Toribio Polanco
v.0.01
*/

class DataTable {
    element;
    headers;
    items;
    copyItems;
    selected;
    pagination;
    numberOfEntries;
    headerButtons;

    //crear constructor asignar valores 
    constructor(selector, headerButtons) {
        this.element = document.querySelector(selector);

        this.headers = [];
        this.items = [];

        this.pagination = {
            total: 0,
            noItemsPerPage: 0,
            noPages: 0,
            actual: 0,
            pointer: 0,
            diff: 0,
            lastPageBeforeDots: 0,
            noButtonsBeforeDots: 4
        }

        this.selected = [];
        this.numberOfEntries = 5;
        this.headerButtons = headerButtons;


    }

    //obtener los elementos de la tabla y destructurizarlos a un objeto
    parse() {
        const headers = [... this.element.querySelector('thead tr').children];
        const trs = [... this.element.querySelector('tbody').children];

        //correr los elementos del header
        headers.forEach(element => {
            this.headers.push(element.textContent)
        })


        //recorrer los elementos tr
        if(trs.length > 0){
            trs.forEach(tr => {
            const cells = [...tr.children]

            const item = {
                id: this.generateUUID(),
                values: []
            }

            cells.forEach(cell => {
                if (cell.children.length > 0) {
                    const statusElement = [...cell.children][0]
                    const status = statusElement.getAttribute('class')

                    if (status !== null) {
                        item.values.push(`<span class='${status}'></span>`)
                    } else {
                        item.values.push(cell.textContent)
                    }
                } else {
                    item.values.push(cell.textContent)
                }
            });

            this.items.push(item)
        });
        }
        this.makeTable()
    }



    //paginar el numero de entradas
    initPagination(total, entries) {
        this.pagination.total = total;
        this.pagination.noItemsPerPage = entries;
        this.pagination.noPages = Math.ceil(this.pagination.total / this.pagination.noItemsPerPage);
        this.pagination.actual = 1;
        this.pagination.pointer = 0;
        this.pagination.diff = this.pagination.noItemsPerPage - (this.pagination.total % this.pagination.noItemsPerPage)
    }

    //generar id para cada elemento creado
    generateUUID() {
        return Date.now() * Math.floor(Math.random() * 100000).toString()
    }


    //#region -> funciones para renderizado  
    makeTable() {
        this.copyItems = [...this.items];
        this.initPagination(this.items.length, this.numberOfEntries);

        const container = document.createElement('div');
        container.id = this.element.id;
        this.element.innerHTML = '';
        this.element.replaceWith(container);
        this.element = container;

        this.createHTML();
        this.renderHeaders();
        this.renderRows();
        this.renderPagesButtons();
        this.renderHeaderButtons();
        this.renderSearch();
        this.renderSelectedEntries();
    }

    createHTML() {
        this.element.innerHTML =
            `
    <div class="datatable-container">
    <div class="header-tools">
        <div class="tools">
            <ul class="header-buttons-container"></ul>
        </div>

        <div class="search">
            <input type="search" placeholder="Buscar..." class="search-input" />
        </div>
    </div>

    <table class="datatable">
        <thead>
            <tr></tr>
        </thead>
        <tbody>
        </tbody>
    </table>
    <div class="footer-tools">
        <div class="list-items">
            Mostrar
            <select name="n-entries" id="n-entries" class="n-entries"></select>
            entradas
        </div>

        <div class="pages"></div>
    </div>
</div>
            `
    }

    //renderizar header de la tabla
    renderHeaders() {
        this.element.querySelector('thead tr').innerHTML = '';

        this.headers.forEach(header => {
            this.element.querySelector('thead tr').innerHTML += `<th>${header}</th>`
        })
    }

    //renderizar filas paginadas
    renderRows() {
        this.element.querySelector('tbody').innerHTML = '';

        let i = 0;
        const { pointer, total } = this.pagination;
        const limit = this.pagination.actual * this.pagination.noItemsPerPage;

        for (i = pointer; i < limit; i++) {
            if (i === total) break;

            const { id, values } = this.copyItems[i]
            let data = '';

            values.forEach(cell => {
                data += `<td>${cell}</td>`
            })

            this.element.querySelector('tbody').innerHTML += `<tr>${data}</tr>`
        }
    }

    //renderizar botones de paginacion 
    renderPagesButtons() {
        const pagesContainer = this.element.querySelector('.pages');
        let pages = '';

        const buttonsToShow = this.pagination.noButtonsBeforeDots;
        const actualIndex = this.pagination.actual;

        let limI = Math.max(actualIndex - 2, 1);
        let limS = Math.min(actualIndex + 2, this.pagination.noPages);
        const missingButtons = buttonsToShow - (limS - limI)

        if (Math.max(limI - missingButtons, 0)) {
            limI = limI - missingButtons;
        } else if (Math.min(limS + missingButtons, this.pagination.noPages) !== this.pagination.noPages) {
            limS = limS + missingButtons;
        }

        // mostrar ultimo boton activo 
        if (limS < (this.pagination.noPages - 2)) {
            pages += this.getIteratedButtons(limI, limS)
            pages += `<li>...</li>`;
            pages += this.getIteratedButtons(this.pagination.noPages - 1, this.pagination.noPages)
        } else {
            pages += this.getIteratedButtons(limI, this.pagination.noPages)
        }
        pagesContainer.innerHTML = `<ul>${pages}</ul>`;
    
        //obtener eventos de los botones y filtar la informacion
        this.element.querySelectorAll('.pages li button').forEach(button => {
            button.addEventListener('click', e => {
                this.pagination.actual = parseInt(e.target.getAttribute('data-page'));
                this.pagination.pointer = (this.pagination.actual * this.pagination.noItemsPerPage) - this.pagination.noItemsPerPage; 
                this.renderRows()
                this.renderPagesButtons();
            })
        })
    
    }

    //dibujar los botones de inicio y ultimo cuando la cantidad de registros es mucha
    getIteratedButtons(start, end) {
        let res = '';
        for (let i = start; i <= end; i++) {
            if (i === this.pagination.actual) {
                res += `<li><span class="active">${i}</span></li>`
            } else {
                res += `<li><button data-page="${i}">${i}</button></li>`
            }
        }

        return res;
    }

    //renderizar botones personalizados para agregar al usuario
    renderHeaderButtons() {
        let html = '';
        const buttonsContainer = this.element.querySelector('.header-buttons-container')
        const headerButtons = this.headerButtons;
        headerButtons.forEach(button => {
           html += `
           <li>
                <button id="${button.id}">
                    <i class="material-icons">${button.icon}</i>
                </button>
           </li>
           ` 
           buttonsContainer.innerHTML = html;
        })


         //obtener lista de botones y los eventos
         headerButtons.forEach(button => {
            //obtener listener y pasar accion
            document.querySelector(`#${button.id}`).addEventListener('click', button.action);
        });

    }

    //renderizar registros para la busqueda 
    renderSearch() { 
            this.element.querySelector('.search-input').addEventListener('input', e=> {
            const query = e.target.value.trim().toLowerCase();
            
            if(query === ''){
                this.copyItems = [... this.items];
                this.initPagination(this.copyItems.length, this.numberOfEntries);
                this.renderRows();
                this.renderPagesButtons();
                return;
            }
            
            this.search(query)
            this.initPagination(this.copyItems.length, this.numberOfEntries)
            this.renderRows();
            this.renderPagesButtons();
        
        })
    }

    //mapear las colleciones segun el parametro que reciba la funcion  
    search(query){
        let res = [];
        this.copyItems = [...this.items]
        for(let i = 0; i < this.copyItems.length; i++){
            const {id, values} = this.copyItems[i];
            const row = values;

            for(let j = 0; j < row.length; j++){
                const cell = row[j];
                if(cell.toLowerCase().indexOf(query) >= 0){
                    res.push(this.copyItems[i])
                    break;
                }
            }
        }

        this.copyItems = [...res];
    }

    //filtrar por cantidad de entradas
    renderSelectedEntries() { 
        const select = this.element.querySelector("#n-entries");

        const html = [5, 10, 15].reduce((acc, item) => {
            return (acc += `<option value="${item}" ${
                this.numberOfEntries === item ? "selected" : ""
            }>${item}</option>`);
        }, "");

        select.innerHTML = html;

        this.element
            .querySelector("#n-entries")
            .addEventListener("change", (e) => {
                const numberOfEntries = parseInt(e.target.value);
                this.numberOfEntries = numberOfEntries;

                this.initPagination(
                    this.copyItems.length,
                    this.numberOfEntries
                );
                this.renderRows();
                this.renderPagesButtons();
                this.renderSearch();
            });
    }
    //#endregion

    //agregar elemento
    addItem(item){
        const row = {
            id: this.generateUUID(),
            values: []
        }

        item.shift();
        row.values = [1, ...item]
        this.items = [row, ...this.items]
        this.makeTable();
    }


} //cierre de la clase


