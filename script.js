"use strict";

let pageHasLoaded = true;
let added = [];
let result = 0;

const getData = async () => {
    const request = await fetch('https://fake-coffee-api.vercel.app/api');
    const data = await request.json();
    return data;
}
const createCards = async () => {
    let cardsSection = document.getElementById('cardsSection');
    let searchProduct = document.getElementById('searchProduct');
    let finded = false;
    cardsSection.innerHTML = `<div class= spinner></div>`;
    cardsSection.style.setProperty('grid-template-columns', '1fr')
    for (let coffee of await getData()) {
        let spinner = document.querySelector('.spinner');
        if (spinner != null) {
            spinner.remove();
        }
        const search = coffee.name.toUpperCase().startsWith(searchProduct.value.toUpperCase());
        if (search) {
            finded = true;
            cardsSection.style.removeProperty('grid-template-columns');
            let newCard = document.createElement('div');
            newCard.className = 'card';
            newCard.innerHTML = `<div class="img">
            <img src=${coffee.image_url} alt="">
            </div>
            <div>
            <p class="description">${coffee.name}</p>
            <p class="price">$${coffee.price}</p>
            </div>
            <div class="card__addToCart">
            <input type="number"id="amount${coffee.id}" class= "amount" value="1" min="1" max="10">
            <button id="addBtn${coffee.id}" class= "addBtn">Agregar</button>
            </div>
            `;
            cardsSection.appendChild(newCard);
            const observer = new IntersectionObserver(observeElement);
            observer.observe(newCard);
        }
    }
    if (!finded) {
        cardsSection.style.setProperty('grid-template-columns', '1fr')
        cardsSection.innerHTML = '<p class="notFoundText">Producto no encontrado</p>'
    }
    addToCart();
}
const verifyDataContent = (shopCart, subTotal) => {
    const request = indexedDB.open("Fat Coffee's DataBase", 1);
    pageHasLoaded = false;
    request.addEventListener('upgradeneeded', () => {
        const db = request.result;
        db.createObjectStore('CoffeeData', {
            autoIncrement : true
        });
    })
    request.addEventListener('success', () => {
        const db = request.result;
        const transaction = db.transaction('CoffeeData', 'readwrite');
        const objectStore = transaction.objectStore('CoffeeData');
        const cursor = objectStore.openCursor();
        cursor.addEventListener('success', () => {
            if (cursor) {
                if (cursor.result != null) {
                    added.push(cursor.result.value);
                    if (cartLength.style.display = 'none') {
                        cartLength.style.display = 'flex';
                    }
                    cartLength.textContent = added.length;
                    cursor.result.continue();
                }
                else {
                    subTotal.style.display = 'none';
                    added.forEach(async coffee => {
                        if (subTotal.style.display == 'none') {
                            subTotal.style.display = 'block';
                        }
                        for (let e of await getData()) {
                            if (coffee.type === e.name) {
                                if (shopCart.innerText == 'Carrito Vacio') {
                                    shopCart.innerHTML = '';
                                }
                                generateElement(e, shopCart,  coffee, subTotal);
                            }
                        }
                    })
                }
            }
        })
    })
}
const addToCart = async () => {
    let shopCart = document.getElementById('cartItems');
    let subTotal = document.getElementById('subTotal');
    let cartLength = document.getElementById('cartLength');
    if (pageHasLoaded) {
        verifyDataContent(shopCart, subTotal);
    }
    for (let coffee of await getData()) {
        let addBtn = document.getElementById(`addBtn${coffee.id}`);
        if (addBtn != null) {
            addBtn.addEventListener('click', () => {
                let finded = false;
                cartLength.style.display = 'flex';
                if (added.length == 0) {
                    shopCart.innerHTML = '';
                    subTotal.style.display = 'block';
                }
                added.forEach(e => {
                    if (e.type === coffee.name) {
                        finded = true;
                    }
                })
                if (finded == false) {
                    let amount = document.getElementById(`amount${coffee.id}`);
                    if (parseInt(amount.value) <= 0 || amount.value == '') {
                        amount.value = 1;
                    }
                    added.push({type: coffee.name, price: coffee.price, amount: parseInt(amount.value)});
                    cartLength.textContent = added.length;
                    addToDataBase(coffee);
                    added.forEach(e=> {
                        if(e.type == coffee.name) {
                            generateElement(coffee, shopCart, e, subTotal);
                        }
                    })
                    Swal.fire({
                        text: 'Producto agregado',
                        showConfirmButton: false,
                        timer: 1000,
                        background: '#444',
                        color: '#fff',
                        width: '200px'
                    })
                }
                else {
                    showCart();
                    let elementInCart = document.getElementById(`element${coffee.id}`);
                    elementInCart.classList.add('borderAnimation');
                    setTimeout(() => {
                        elementInCart.classList.remove('borderAnimation');
                    }, 3000);
                }
            })
        }
    }
}
const addToDataBase = (coffee) => {
    let amount = document.getElementById(`amount${coffee.id}`);
    const request = indexedDB.open("Fat Coffee's DataBase", 1);
    request.addEventListener('upgradeneeded', () => {
        const db = request.result;
        db.createObjectStore('CoffeeData', {
            autoIncrement : true
        });
    })
    request.addEventListener('success', () => {
        const db = request.result;
        const transaction = db.transaction('CoffeeData', 'readwrite');
        const objectStore = transaction.objectStore('CoffeeData');
        objectStore.add({type: coffee.name, price: coffee.price, amount: parseInt(amount.value)});
    })
}
const deleteFromDataBase = (coffee) => {
    const request = indexedDB.open("Fat Coffee's DataBase", 1);
    request.addEventListener('success', () => {
        const db = request.result;
        const transaction = db.transaction('CoffeeData', 'readwrite');
        const objectStore = transaction.objectStore('CoffeeData');
        const key = objectStore.getAllKeys();
        key.addEventListener('success', () => {
            const result = key.result;
            result.forEach(e => {
                const getElement = objectStore.get(e);
                getElement.addEventListener('success', () => {
                    if (getElement.result.type === coffee.name) {
                        objectStore.delete(e);
                    }
                })
            })
        })
    })
}
const modifyAmountValue = (coffee, btn, finalPrice) => {
    let selectedAmount = document.getElementById(`selectedAmount${coffee.id}`);
    let newAmount = (parseInt(selectedAmount.textContent));
    result = 0;
    if (btn == 'Plus') {
        newAmount = (parseInt(selectedAmount.textContent))+1
    }
    else {
        if (parseInt(selectedAmount.textContent) != 1) newAmount = (parseInt(selectedAmount.textContent))-1;
    }
    selectedAmount.textContent = `${newAmount} `;
    added.forEach(e => {
        if (e.type === coffee.name) {
            e.amount = newAmount;
            modifyDataContent(coffee, newAmount);
        }
        result += e.price*e.amount;
        finalPrice.textContent = result.toFixed(2);
    })
}
const modifyDataContent = (coffee, newAmount) => {
    const request = indexedDB.open("Fat Coffee's DataBase", 1);
    request.addEventListener('success', () => {
        const db = request.result;
        const transaction = db.transaction('CoffeeData', 'readwrite');
        const objectStore = transaction.objectStore('CoffeeData');
        const key = objectStore.getAllKeys();
        key.addEventListener('success', () => {
            const result = key.result;
            result.forEach(e => {
                const getElement = objectStore.get(e);
                getElement.addEventListener('success', () => {
                    if (getElement.result.type === coffee.name) {
                        getElement.result.amount = newAmount;
                        objectStore.put(getElement.result, e);
                    }
                })
            })
        })
    })
}
const generateElement = (coffee, shopCart, e, subTotal) => {
    let finalPrice = document.getElementById('finalPrice');
    let newElement = document.createElement('div');
    result += e.amount*e.price;
    finalPrice.textContent = result.toFixed(2);
    newElement.id = `element${coffee.id}`;
    newElement.className = 'cartSection__element';
    newElement.innerHTML = `<p id= "selectedAmount${coffee.id}">${e.amount} </p>
    <img src=${coffee.image_url} alt="">
    <div class="cartSection__element__descr-prc">
    <p class="cartSection__element__descr-prc__description">${coffee.name}</p>
    <p class="cartSection__element__descr-prc__price">$${coffee.price}</p>
    </div>
    <div>
    <i class="fa-solid fa-plus" id= "plusIcon${coffee.id}"></i>
    <i class="fa-solid fa-minus" id= "minusIcon${coffee.id}"></i>
    </div>
    <div>
    <i class="fa-solid fa-trash" id= "trashElement${coffee.id}"></i>
    </div>
    `
    shopCart.appendChild(newElement);
    
    let plusIcon = document.getElementById(`plusIcon${coffee.id}`);
    let minusIcon = document.getElementById(`minusIcon${coffee.id}`);
    let trash = document.getElementById(`trashElement${coffee.id}`);
    let btnClicked;
    trash.addEventListener('click', () => {
        added.splice(added.indexOf(e), 1);
        cartLength.textContent = added.length;
        result = 0;
        added.forEach(el=> {
            result += el.amount*el.price;
            finalPrice.textContent = result.toFixed(2);
        })
        if (added.length == 0) {
            shopCart.innerHTML = `<p class="emptyCartText">Carrito Vacio</p>`;
            subTotal.style.display = 'none';
            cartLength.style.display = 'none';
        }
        newElement.remove();
        deleteFromDataBase(coffee);
    })
    plusIcon.addEventListener('click', () => {
        btnClicked = 'Plus';
        modifyAmountValue(coffee,  btnClicked, finalPrice);
    })
    minusIcon.addEventListener('click', () => {
        btnClicked = 'Minus';
        modifyAmountValue(coffee,  btnClicked, finalPrice);
    })
}
const showCart = () => {
    document.querySelector('.cartSection').classList.remove('hidden');
    document.body.style.overflowY = 'hidden';
}
const hideCart = () => {
    document.querySelector('.cartSection').classList.add('hidden');
    document.body.style.overflowY = 'auto';
}
const searchCoffees = () => {
    let searchIcon = document.querySelectorAll('.fa-magnifying-glass');
    let searchIcon2 = document.getElementById('search')
    let inputSearchContainer = document.getElementById('inputSearchContainer');
    searchIcon[1].addEventListener('click', () => {
        inputSearchContainer.style.translate = '0'
    })
    searchIcon2.addEventListener('click', () => {
        inputSearchContainer.style.translate = '0 -40px'
        createCards();
    })
}
const observeElement = (entry) => {
    if (entry[0].isIntersecting) {
        entry[0].target.style.opacity = 1;
    }
}

let cartIcon = document.querySelector('.fa-cart-shopping');
cartIcon.addEventListener('click', () => {
    showCart();
});
let crossIcon = document.querySelector('.fa-xmark');
crossIcon.addEventListener('click', () => {
    hideCart();
})

createCards();
searchCoffees();