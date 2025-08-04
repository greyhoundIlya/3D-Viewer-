/**
 * Корневой редуктор Redux
 * Объединяет все редукторы приложения в один
 */

import { combineReducers } from "redux" // Функция для объединения редукторов

// Импорт отдельных редукторов
import MaterialReducer from "./MaterialReducer" // Редуктор для материалов
import MeshReducer from "./MeshReducer"       // Редуктор для сеток (meshes)
import NodeReducer from "./NodeReducer"       // Редуктор для узлов модели
import ProductReducer from "./ProductReducer" // Редуктор для продуктов (моделей)

/**
 * Объединение всех редукторов в один корневой редуктор
 * Каждый редуктор отвечает за свою часть состояния Redux:
 * - productStore: хранит список продуктов и текущий выбранный продукт
 * - nodeStore: хранит узлы текущей модели и выбранный узел
 * - meshStore: хранит сетки (meshes) модели и выбранную сетку
 * - materialStore: хранит материалы и настройки для них
 */
const RootReducer = combineReducers({
  productStore: ProductReducer,
  nodeStore: NodeReducer,
  meshStore: MeshReducer,
  materialStore: MaterialReducer
})

export default RootReducer
