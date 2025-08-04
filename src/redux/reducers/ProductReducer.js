/**
 * Редуктор для управления продуктами (3D-моделями)
 * Обрабатывает действия, связанные с загрузкой и выбором продуктов
 */

// Импорт списка версий сжатия Draco для использования в начальном состоянии
import { DRACO_VERSION_LIST } from "../../constants"

// Импорт констант типов действий
import {
  CURRENT_DRACO_VERSION,     // Установка текущей версии сжатия Draco
  GET_CURRENT_PRODUCT_DATA,  // Получение данных о текущем продукте
  GET_PRODUCT_DATA_LIST,     // Получение списка продуктов
  SET_CURRENT_PRODUCT_DATA   // Установка текущего продукта
} from "../StoreConstants"

/**
 * Начальное состояние для редуктора продуктов
 */
const initialState = {
  productDataList: [],                          // Список всех доступных продуктов
  currentProductData: null,                     // Текущий выбранный продукт (краткие данные)
  productData: null,                            // Полные данные о выбранном продукте
  currentDracoVersion: DRACO_VERSION_LIST[0].id // Текущая версия сжатия (по умолчанию - без сжатия)
}

/**
 * Редуктор продуктов
 * Обрабатывает действия, связанные с продуктами и обновляет состояние
 */
const ProductReducer = (state = initialState, action) => {
  switch (action.type) {
    // Получение детальных данных о текущем продукте
    case GET_CURRENT_PRODUCT_DATA:
      return {
        ...state,
        productData: action.payload // Устанавливаем полные данные о продукте
      }

    // Получение списка всех продуктов
    case GET_PRODUCT_DATA_LIST:
      return {
        ...state,
        productDataList: [...action.payload] // Обновляем список продуктов
      }

    // Установка текущего выбранного продукта
    case SET_CURRENT_PRODUCT_DATA:
      return {
        ...state,
        currentProductData: action.payload // Устанавливаем текущий продукт
      }

    // Установка текущей версии сжатия Draco
    case CURRENT_DRACO_VERSION:
      return {
        ...state,
        currentDracoVersion: action.payload // Обновляем версию сжатия
      }

    // Обработка неизвестных типов действий
    default: {
      return {
        ...state // Возвращаем текущее состояние без изменений
      }
    }
  }
}

export default ProductReducer
