/**
 * Список друзей и список id'шников друзей перемещенных в правый список
 *
 * @type {{friendList: Array, movedFriends: Array}}
 */
let appData = {
        friendList: [],
        movedFriends: []
    },
    leftUl,
    rightUl,
    leftFilterInput,
    rightFilterInput,
    dragObject = {
        draggingElement: null,
        startCursPosX: 0,
        startCursPosY: 0,
        startElPosX: 0,
        startElPosY: 0
    };

/**
 * Запрос к vkApi
 *
 * @param method Метод Api
 * @param options Параметры запроса
 * @returns {Promise}
 */
function vkApi(method, options = {}) {
    if (!options.v) {
        options.v = '5.64';
    }

    return new Promise((resolve, reject) => {
        VK.api(method, options, data => {
            if (data.error) {
                reject(new Error(data.error.error_msg));
            } else {
                resolve(data.response);
            }
        });
    });
}

/**
 * Инициализация vkApi
 *
 * @returns {Promise}
 */
function vkInit() {
    return new Promise((resolve, reject) => {
        VK.init({
            apiId: 6612500
        });

        VK.Auth.login(data => {
            if (data.session) {
                resolve();
            } else {
                reject(new Error('Не удалось авторизоваться'));
            }
        }, 2);
    });
}

/**
 * Инициализируются списки приложения в соответствии с сохраненными данными
 *
 * @param friendList
 * @returns {Promise}
 */
function initAppData(friendList) {
    return new Promise((resolve) => {
        // Инициализация всего списка друзей
        appData.friendList = friendList.items;

        // Инициализация сохраненного списка друзей
        let movedFriends = localStorage.getItem('movedFriends');

        if (movedFriends) {
            appData.movedFriends = movedFriends.split(',').map(item => parseInt(item));
        }

        resolve();
    });
}

/**
 * Рисует левый и правый списки друзей
 */
function renderLists() {
    let leftListParts = [],
        rightListParts = [];

    for (let friend of appData.friendList) {
        let isMoved = appData.movedFriends.indexOf(friend.id) >=0;

        // Фильтрация друзей
        if (isMoved) {
            if (rightFilterInput.value && !filter(friend, rightFilterInput.value)) {
                continue;
            }
        } else {
            if (leftFilterInput.value && !filter(friend, leftFilterInput.value)) {
                continue;
            }
        }

        let part = `
<li data-user-id="${friend.id}">
    <img src="${friend.photo_100}" width="70" height="70">
    <span class="friendName">${friend.first_name} ${friend.last_name}</span>
    <span class="actionButton"><i class="fa ${isMoved ? 'fa-times' : 'fa-plus'} actionButtonIcon"></i></span>
</li>
        `;

        if (isMoved) {
            rightListParts.push(part);
        } else {
            leftListParts.push(part);
        }
    }

    leftUl.innerHTML = leftListParts.join('');
    rightUl.innerHTML = rightListParts.join('');
}

/**
 * Возвращает true если имя или фамилия начинается со значения фильтра
 *
 * @param friendObj
 * @param filterVal
 * @returns {boolean}
 */
function filter(friendObj, filterVal) {
    return friendObj.first_name.toLowerCase().indexOf(filterVal.toLowerCase()) === 0 ||
           friendObj.last_name.toLowerCase().indexOf(filterVal.toLowerCase()) === 0;
}

/**
 * Возвращает userId, если пользователь нажал на кнопку в списке друзей
 *
 * @param clickTarget
 * @returns {*}
 */
function getUserIdByClick(clickTarget) {
    let li = null;

    if (clickTarget.closest('.actionButton')) {
        li = clickTarget.closest('li');
    }

    if (li !== null) {
        return parseInt(li.dataset.userId);
    }

    return null;
}

/**
 * Перемещение пользователя в правый список
 *
 * @param userId
 */
function moveRight(userId) {
    appData.movedFriends.push(userId);
    renderLists();
}

/**
 * Перемещение пользователя в левый список
 *
 * @param userId
 */
function moveLeft(userId) {
    appData.movedFriends.splice(appData.movedFriends.indexOf(userId), 1);
    renderLists();
}

/**
 * Навешивание и обработка событий нажатий на кнопки и инпуты
 */
function initActionButtons() {
    // Делегирование событий нажатия кнопок элементам списков
    leftUl.addEventListener('click', e => {
        let userId = getUserIdByClick(e.target);

        if (userId) {
            moveRight(userId);
        }
    });

    rightUl.addEventListener('click', e => {
        let userId = getUserIdByClick(e.target);

        if (userId) {
            moveLeft(userId);
        }
    });

    // Лбработка фильтрующих инпутов
    leftFilterInput.addEventListener('keyup', () => {
        renderLists();
    });

    rightFilterInput.addEventListener('keyup', () => {
        renderLists();
    });

    // Обработка нажатия на кнопку "Сохранить"
    document.getElementById('saveButton').addEventListener('click', () => {
        localStorage.setItem('movedFriends', appData.movedFriends);
    });
}

/**
 * Навешивание и обработка событий drag and drop
 */
function initDrugAndDrop() {
    document.addEventListener('mousedown', e => {
        let li = e.target.closest('li');

        // Drug and drop запускается при клике на li, но не на кнопке экшина
        if (li && !e.target.closest('.actionButton')) {
            let cloneLi = li.cloneNode(true);

            // cloneLi.innerHTML = li.innerHTML;
            cloneLi.style.position = 'fixed';
            cloneLi.style.opacity = '0.7';
            cloneLi.style.cursor = 'move';
            cloneLi.style.left = li.getBoundingClientRect().left + 'px';
            cloneLi.style.top = li.getBoundingClientRect().top + 'px';
            li.parentNode.appendChild(cloneLi);

            dragObject.draggingElement = cloneLi;
            dragObject.startCursPosX = e.pageX;
            dragObject.startCursPosY = e.pageY;
            dragObject.startElPosX = li.getBoundingClientRect().left;
            dragObject.startElPosY = li.getBoundingClientRect().top;

            // Отменяем выделение текста при перетаскивании
            document.body.addEventListener('selectstart', preventDefaultHandler);
        }
    });

    document.addEventListener('mousemove', e => {
        if (dragObject.draggingElement !== null) {
            dragObject.draggingElement.style.left = (e.pageX - dragObject.startCursPosX + dragObject.startElPosX) + 'px';
            dragObject.draggingElement.style.top = (e.pageY - dragObject.startCursPosY + dragObject.startElPosY) + 'px';
        }
    });

    document.addEventListener('mouseup', e => {
        if (dragObject.draggingElement !== null) {
            let userId = parseInt(dragObject.draggingElement.dataset.userId);

            // Очитска объектов
            dragObject.draggingElement.parentNode.removeChild(dragObject.draggingElement);
            dragObject.draggingElement = null;

            // Проверка где был опущен элемент и надо ли его перемещать
            let element = document.elementFromPoint(e.pageX, e.pageY);

            if (appData.movedFriends.indexOf(userId) >= 0) {
                // Перемещение друга из правого списка
                if (element && element.closest('#leftFriendList')) {
                    moveLeft(userId);
                }
            } else {
                // Перемещение друга из левого списка
                if (element && element.closest('#rightFriendList')) {
                    moveRight(userId);
                }
            }

            // Вовращаем возможность выделения текста
            document.body.removeEventListener('selectstart', preventDefaultHandler);
        }
    });
}

/**
 * Обработчик события, отменяющий действие по умолчанию
 *
 * @param e
 */
function preventDefaultHandler(e) {
    e.preventDefault()
}

new Promise((resolve) => {
    window.onload = function() {
        // Получение элементов списков
        leftUl = document.getElementById('leftFriendList');
        rightUl = document.getElementById('rightFriendList');

        // Получение инпутов фильтрации
        leftFilterInput = document.getElementById('leftSearchInput');
        rightFilterInput = document.getElementById('rightSearchInput');

        resolve();
    }
})
.then(() => vkInit())
.then(() => vkApi('friends.get', { fields: 'photo_100' }))
.then(response => initAppData(response))
.then(() => renderLists())
.then(() => initActionButtons())
.then(() => initDrugAndDrop())
.catch(e => alert('Ошибка: ' + e.message));