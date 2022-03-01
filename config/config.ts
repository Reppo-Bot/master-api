interface IConfig {
    APP_NAME: string,
    APP_VERSION: string,
    APP_DESCRIPTION: string,
    APP_AUTHOR: string,
    APP_HOST: string,
    APP_PORT: number,
}

const commonConfig = {
    APP_NAME: 'reppo-api',
    APP_VERSION: '0.0.1',
    APP_DESCRIPTION: 'The API for the backend',
    APP_AUTHOR: 'Reppo Team',
    APP_HOST: 'localhost',
}

const developmentConfig = {
    APP_PORT: 8080,
}

const stagingConfig = {
    APP_PORT: 8080,
}

const productionConfig = {
    APP_PORT: 8080,
}

export default (): IConfig => {
    switch (process.env.NODE_ENV) {
        case 'development':
            return { ...commonConfig, ...developmentConfig }
        case 'production':
            return { ...commonConfig, ...productionConfig }
        case 'staging':
            return { ...commonConfig, ...stagingConfig }
        default:
            return { ...commonConfig, ...developmentConfig }
    }
}