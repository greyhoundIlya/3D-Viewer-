/**
 * Компонент ProductSelector - выбор 3D-модели продукта
 * 
 * Позволяет пользователю выбрать 3D-модель продукта для конфигурирования.
 * В текущей версии в наличии только одна модель - "My Custom Model".
 * 
 * При выборе продукта загружается соответствующая модель и настройки.
 * Компонент отображается в левом верхнем углу интерфейса в панели управления.
 */

// Импорты библиотек и компонентов
import React, { useEffect } from "react" // React и хук эффекта
import { connect } from "react-redux" // Для подключения к Redux
import { PropTypes } from "prop-types" // Для проверки типов
import { FormControl, InputLabel, Select } from "@material-ui/core" // UI-компоненты
import { makeStyles } from "@material-ui/core/styles" // Для стилизации

// Импорт Redux-действий для работы с продуктами
import {
  getCurrentProductData,  // Получить данные о текущем продукте
  getProductDataList,     // Получить список всех продуктов
  setCurrentProductData   // Установить текущий выбранный продукт
} from "../../redux/actions/ProductActions"

// Импорт действия для сброса выбранного узла при смене продукта
import { setCurrentNodeData } from "../../redux/actions/NodeActions"

/**
 * Стили для компонента выбора продукта
 */
const useStyles = makeStyles(theme => ({
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120
  }
}))

/**
 * Компонент выбора продукта (3D-модели)
 * Отображает выпадающий список доступных продуктов и позволяет выбрать модель для отображения
 */
const ProductSelector = props => {
  const classes = useStyles() // Применяем стили

  // Извлекаем данные и действия из props
  const {
    productStore,           // Состояние хранилища продуктов
    getCurrentProductData,  // Функция для загрузки данных о выбранном продукте
    getProductDataList,     // Функция для загрузки списка продуктов
    setCurrentProductData,  // Функция для установки выбранного продукта
    setCurrentNodeData      // Функция для сброса выбранного узла
  } = props

  // Формируем список опций для выпадающего списка
  const options = productStore.productDataList.map(p => {
    return (
      <option key={p.id} value={p.id}>
        {p.label}
      </option>
    )
  })

  // Эффект, срабатывающий при смене выбранного продукта
  useEffect(() => {
    if (productStore.currentProductData) {
      // Загружаем данные о выбранном продукте (модели)
      getCurrentProductData(productStore.currentProductData.path)
    } else {
      getCurrentProductData(null) // Сброс, если продукт не выбран
    }

    // Сбрасываем выбранный узел при смене продукта
    setCurrentNodeData(null)
  }, [productStore.currentProductData]) // Зависимость - текущий продукт

  // Эффект, загружающий список продуктов при монтировании компонента
  useEffect(() => {
    getProductDataList() // Загружаем список всех доступных продуктов
  }, []) // Пустой массив зависимостей - выполняется один раз

  /**
   * Рендеринг компонента выбора продукта
   * Отображает выпадающий список с доступными 3D-моделями
   */
  return (
    <FormControl fullWidth className={classes.formControl}>
      <InputLabel shrink variant="outlined" id="product-selector">
        Выбрать модель
      </InputLabel>
      <Select
        labelId="product-selector"
        native
        labelWidth={50}
        label="Выбрать модель"
        variant="outlined"
        style={{
          width: 300
        }}
        value={productStore.currentProductData?.id ?? ""} // Устанавливаем текущее значение или пустую строку
        onChange={event => {
          // При изменении находим выбранный продукт в списке и устанавливаем его как текущий
          setCurrentProductData(
            productStore.productDataList.find(p => p.id === event.target.value)
          )
        }}
      >
        <option value="">None</option>
        {options} {/* Отображаем список опций из productStore */}
      </Select>
    </FormControl>
  )
}

const mapStateToProps = state => ({
  productStore: state.productStore,
  getCurrentProductData: PropTypes.func.isRequired,
  getProductDataList: PropTypes.func.isRequired,
  setCurrentProductData: PropTypes.func.isRequired,
  setCurrentNodeData: PropTypes.func.isRequired
})

export default connect(mapStateToProps, {
  getCurrentProductData,
  getProductDataList,
  setCurrentProductData,
  setCurrentNodeData
})(ProductSelector)
