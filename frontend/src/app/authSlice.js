import { createSlice } from '@reduxjs/toolkit'

const STORAGE_KEY = 'bussdash.token'

const initialState = {
  token: localStorage.getItem(STORAGE_KEY) || null,
  account: null,
  business: null,
  flags: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    sessionEstablished(state, action) {
      const { token, account, business, flags } = action.payload
      if (token) {
        state.token = token
        localStorage.setItem(STORAGE_KEY, token)
      }
      state.account = account
      state.business = business
      state.flags = flags
    },
    loggedOut(state) {
      state.token = null
      state.account = null
      state.business = null
      state.flags = null
      localStorage.removeItem(STORAGE_KEY)
    },
  },
})

export const { sessionEstablished, loggedOut } = authSlice.actions
export default authSlice.reducer

export const selectAuth = (state) => state.auth
export const selectIsAuthenticated = (state) => Boolean(state.auth.token)
