/**
 * Компонент MaterialSelector - выбор материала для выбранной части модели
 * 
 * Отображает галерею доступных материалов для выбранного узла и меша модели.
 * Каждый материал представлен превью изображением и названием.
 * Пользователь может выбрать материал, нажав на его превью.
 * 
 * Компонент находится в нижней левой части интерфейса.
 */
import React, { useEffect } from "react"
import { connect } from "react-redux"
import { PropTypes } from "prop-types"
import { Grid, IconButton, Avatar, Typography } from "@material-ui/core"
import { makeStyles } from "@material-ui/core/styles"
import {
  setCurrentMaterialData,
  setSelectedMeshMaterial
} from "../../redux/actions/MaterialActions"

const useStyles = makeStyles(theme => ({
  root: {
    marginLeft: '30px',
    display: "flex",
    "& > *": {
      margin: theme.spacing(0.5) // Уменьшили отступы с 1 до 0.5
    },
    [theme.breakpoints.down('sm')]: {
      marginLeft: '-20px', // Убираем отступ на мобильных устройствах
    }
  }
}))

const useAvatarStyles = makeStyles(theme => ({
  root: {
    width: 45, // Уменьшили с 60 до 45
    height: 45, // Уменьшили с 60 до 45
    border: "2px solid" // Уменьшили границу с 3px до 2px
  }
}))

const MaterialSelector = props => {
  const classes = useStyles()
  const classesAvatar = useAvatarStyles()

  const {
    materialStore,
    meshStore,
    nodeStore,
    productStore,
    setCurrentMaterialData,
    setSelectedMeshMaterial
  } = props

  useEffect(() => {
    setCurrentMaterialData(null)
  }, [nodeStore.currentNodeData])

  return (
    <>
      <Grid item className={classes.root}>
        {nodeStore.currentNodeData ? (
          <Typography variant="h6" style={{ fontSize: '1rem', color: 'white' }}>
            Выберите материал
          </Typography>
        ) : (
          <></>
        )}
      </Grid>
      <Grid item className={classes.root}>
        {nodeStore.currentNodeData?.candidateMaterials.map(materialData => {
          return (
            <IconButton
              key={materialData.name}
              size="small"
              style={{ padding: 4 }} // Уменьшили внутренние отступы кнопки
              color={
                materialStore.selectedMeshMaterial === materialData.name
                  ? "primary"
                  : "default"
              }
              onClick={() => {
                if (materialStore.selectedMeshMaterial !== materialData.name) {
                  setSelectedMeshMaterial(materialData.name)
                  setCurrentMaterialData(materialData.path)
                  if (props.onMaterialSelect) props.onMaterialSelect(materialData);
                }
              }}
            >
              <Avatar
                alt={materialData.name}
                title={materialData.name}
                src={materialData.thumbnail}
                classes={classesAvatar}
              />
            </IconButton>
          )
        })}
      </Grid>
    </>
  )
}

const mapStateToProps = state => ({
  materialStore: state.materialStore,
  meshStore: state.meshStore,
  nodeStore: state.nodeStore,
  productStore: state.productStore,
  setCurrentMaterialData: PropTypes.func.isRequired,
  setSelectedMeshMaterial: PropTypes.func.isRequired
})

export default connect(mapStateToProps, {
  setCurrentMaterialData,
  setSelectedMeshMaterial
})(MaterialSelector)
