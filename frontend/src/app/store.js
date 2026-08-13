import { configureStore } from '@reduxjs/toolkit'
import { baseApi } from '../api/baseApi'
import { schedulingApi } from '../api/schedulingBaseApi'
import authReducer from './authSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [baseApi.reducerPath]: baseApi.reducer,
    [schedulingApi.reducerPath]: schedulingApi.reducer,
  },
  middleware: (getDefault) => getDefault().concat(baseApi.middleware, schedulingApi.middleware),
})
