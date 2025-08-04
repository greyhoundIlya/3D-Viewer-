import React, {useEffect, useRef, useState} from "react"
import styles from "./Globe360.module.css"

const Globe360 = () => {
  const globeRef = useRef(null)
  const [isPaused, setIsPaused] = useState(false)
  const animationRef = useRef(null)

  useEffect(() => {
    // Функция для обновления вращения глобуса в зависимости от камеры
    const updateGlobeRotation = (azimuthalAngle, polarAngle) => {
      if (globeRef.current && !isPaused) {
        // Преобразуем углы камеры в поворот глобуса
        const rotationY = ((azimuthalAngle * 180) / Math.PI) % 360
        globeRef.current.style.transform = `rotateY(${rotationY}deg)`
      }
    }

    // Регистрируем функцию в глобальном объекте window
    window.updateGlobeRotation = updateGlobeRotation

    // Очистка при размонтировании
    return () => {
      delete window.updateGlobeRotation
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPaused])

  const handleMouseEnter = () => {
    setIsPaused(true)
  }

  const handleMouseLeave = () => {
    setIsPaused(false)
  }

  return (
    <div
      className={styles.globeContainer}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={styles.loading} ref={globeRef}>
        <div className={`${styles.llOvals} ${styles.oval1}`}></div>
        <div className={`${styles.llOvals} ${styles.oval2}`}></div>
        <div className={`${styles.llOvals} ${styles.oval3}`}></div>
      </div>
      <div className={`${styles.llOvals} ${styles.ovalHorizontal}`}></div>
      <div className={styles.text360}>360°</div>
    </div>
  )
}

export default Globe360
