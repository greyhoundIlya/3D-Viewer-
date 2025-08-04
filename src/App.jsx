// Импорты основных библиотек и компонентов
import React from "react"
import {Provider} from "react-redux" // Для подключения Redux хранилища
import {Route, Switch} from "react-router" // Компоненты для маршрутизации
import {BrowserRouter} from "react-router-dom" // Основной маршрутизатор для браузера
import {PersistGate} from "redux-persist/integration/react" // Для сохранения состояния Redux между сессиями
import ThemeProvider from "@material-ui/styles/ThemeProvider" // Провайдер темы Material UI
import appTheme from "./theme" // Настройки темы приложения
import {persistor, store} from "./redux/Store" // Redux хранилище и его персистор (для сохранения данных)
import {ROUTE_HOMEPAGE} from "./constants" // Константа для домашней страницы
import Home from "./pages/Home" // Главный компонент страницы

/**
 * Основной компонент приложения
 * Настраивает Redux, маршрутизацию и темы
 */
const App = () => {
  return (
    <>
      <Provider store={store}>
        {" "}
        {/* Подключение Redux-хранилища */}
        <PersistGate loading={null} persistor={persistor}>
          {" "}
          {/* Сохранение состояния между сессиями */}
          <ThemeProvider theme={appTheme}>
            {" "}
            {/* Применение темы Material UI */}
            <BrowserRouter basename="/3d-viewer">
              {/* Настройка маршрутизации */}
              <Switch>
                <Route exact path={ROUTE_HOMEPAGE} component={Home} />{" "}
                {/* Маршрут к главной странице */}
              </Switch>
            </BrowserRouter>
          </ThemeProvider>
        </PersistGate>
      </Provider>
    </>
  )
}

export default App
