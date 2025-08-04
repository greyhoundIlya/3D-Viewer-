/**
 * Компонент Loader - индикатор загрузки для 3D-моделей
 * 
 * Отображает анимированный спиннер во время загрузки 3D-модели,
 * текстур и других ресурсов. Показывается пользователю 
 * до полной загрузки всех необходимых для просмотрщика файлов.
 */
import React from "react"

import styles from "./Loader.module.css"

const Loader = () => {
  return (
    <div className={styles.loader}>
      <svg className={styles.spinner} viewBox="0 0 50 50">
        <circle
          className={styles.path}
          cx="25"
          cy="25"
          r="20"
          fill="none"
          strokeWidth="5"
        ></circle>
      </svg>
    </div>
  )
}

export default Loader
