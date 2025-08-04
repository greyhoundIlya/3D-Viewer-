/**
 * Действия Redux для работы с продуктами (3D-моделями)
 * Включает функции для загрузки и управления моделями
 */

// Импорт констант для типов действий
import {
  CURRENT_DRACO_VERSION,     // Текущая версия сжатия Draco
  GET_CURRENT_PRODUCT_DATA,  // Получить данные о текущем продукте
  GET_PRODUCT_DATA_LIST,     // Получить список всех продуктов
  SET_CURRENT_PRODUCT_DATA   // Установить текущий продукт
} from "../StoreConstants"

/**
 * Загружает подробные данные о выбранном продукте
 * @param {string} path - Путь к JSON-файлу с данными о продукте
 * @returns {Function} - Redux Thunk функция
 */
export function getCurrentProductData(path) {
  return dispatch => {
    if (path) {
      // Если путь указан, загружаем данные о продукте по этому пути
      fetch(path)
        .then(response => response.json())
        .then(data => {
          // Отправляем действие с данными о продукте в Redux
          dispatch({
            type: GET_CURRENT_PRODUCT_DATA,
            payload: data
          })
        })
    } else {
      // Если путь не указан, отправляем null (сброс выбранного продукта)
      dispatch({
        type: GET_CURRENT_PRODUCT_DATA,
        payload: null
      })
    }
  }
}

/**
 * Загружает список всех доступных продуктов
 * @returns {Function} - Redux Thunk функция
 */
export function getProductDataList() {
  return dispatch => {
    // Загружаем список продуктов из JSON-файла
    fetch("/products/products.json")
      .then(response => response.json())
      .then(data => {
        // Отправляем действие со списком продуктов в Redux
        dispatch({
          type: GET_PRODUCT_DATA_LIST,
          payload: data
        })

        // Если есть хотя бы один продукт, выбираем его по умолчанию
        if (data.length > 0) {
          dispatch({
            type: SET_CURRENT_PRODUCT_DATA,
            payload: data[0]
          })
        }
      })
  }
}

/**
 * Устанавливает текущий выбранный продукт
 * @param {Object} data - Данные о выбранном продукте
 * @returns {Function} - Redux Thunk функция
 */
export function setCurrentProductData(data) {
  return dispatch => {
    dispatch({
      type: SET_CURRENT_PRODUCT_DATA,
      payload: data
    })
  }
}

/**
 * Устанавливает текущую версию сжатия Draco для 3D-модели
 * @param {Object} data - Данные о выбранной версии сжатия
 * @returns {Function} - Redux Thunk функция
 */
export function setCurrentDracoVersion(data) {
  return dispatch => {
    dispatch({
      type: CURRENT_DRACO_VERSION,
      payload: data
    })
  }
}
