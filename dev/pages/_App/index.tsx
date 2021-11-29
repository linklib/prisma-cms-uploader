import React from 'react'
import Head from 'next/head'
import { ThemeProvider } from 'styled-components'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import { muiTheme } from './MUI/theme'
import theme from '../../theme'
import { ApolloProvider } from '@apollo/client'
import { useApollo, initializeApollo } from '../../../src/lib/apolloClient'
import NextApp, { AppContext } from 'next/app'
import {
  AppProps,
  MainApp,
  AppInitialPropsCustom,
  NextPageContextCustom,
} from './interfaces'

const withWs = true

const App: MainApp<AppProps> = ({ Component, pageProps }) => {
  //const apolloClient = useApollo(pageProps.initialApolloState, withWs)
  const apolloClient = useApollo(undefined, withWs)

  return (
    <>
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
      </Head>

      <MuiThemeProvider
        theme={muiTheme}
        // For SSR only
        sheetsManager={
          typeof global.window === 'undefined' ? new Map() : undefined
        }
      >
        <ThemeProvider theme={theme}>
          <ApolloProvider client={apolloClient}>
            <Component {...pageProps} />
          </ApolloProvider>
        </ThemeProvider>
      </MuiThemeProvider>
    </>
  )
}

/**
 * This method calls both of back and front side.
 * Usefull for check access or/and data.
 * Add getInitialProps to page Component
 * and return {statusCode: 404} or {statusCode: 403} for example.
 */
App.getInitialProps = async (appContext: AppContext) => {
  /**
   * Initialize apollo-client and path into page props for collect
   * all data in cache.
   */
  const apolloClient = initializeApollo({
    withWs,
    appContext,
  })

  /**
   * Передаваемый далее в страницу контекст
   */
  const ctx: NextPageContextCustom = {
    ...appContext.ctx,
    apolloClient,
  }

  const newAppContext = {
    ...appContext,
    ctx,
  }

  /**
   * Call final _App.getInitialProps, _Document.getInitialProps() and page.getInitialProps()
   */
  const appProps = await NextApp.getInitialProps(newAppContext)

  const { pageProps, ...otherProps } = appProps

  const newProps: AppInitialPropsCustom = {
    ...otherProps,
    pageProps: {
      ...pageProps,
      initialApolloState: apolloClient.cache.extract(),
    },
  }

  /**
   * Got server statusCode
   */
  const { statusCode } = newProps.pageProps

  /**
   * If server-side, add response http code
   */
  if (statusCode && statusCode !== 200 && newAppContext.ctx.res) {
    newAppContext.ctx.res.statusCode = statusCode
  }

  return newProps
}

export default App
