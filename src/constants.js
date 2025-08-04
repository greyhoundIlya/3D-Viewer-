/**
 * Константы для всего приложения
 */

// Путь к главной странице для маршрутизатора
export const ROUTE_HOMEPAGE = "/"
/**
 * Список доступных версий сжатия Draco для 3D-моделей
 * Draco - технология сжатия 3D-геометрии от Google для оптимизации размера моделей
 * Разные уровни сжатия дают разный баланс между размером файла и качеством
 */
export const DRACO_VERSION_LIST = [
  { id: "model", label: "No compression version" }, // Оригинальная модель без сжатия
  { id: "dracoModel0", label: "Compression0 version" }, // Минимальное сжатие
  { id: "dracoModel1", label: "Compression1 version" }, // Низкое сжатие
  { id: "dracoModel3", label: "Compression3 version" }, // Среднее сжатие
  { id: "dracoModel6", label: "Compression6 version" }  // Максимальное сжатие
]
