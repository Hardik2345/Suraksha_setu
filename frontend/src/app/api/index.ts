// Export all API slices and hooks from a single entry point
export { baseApi } from './baseApi';

export {
  authApi,
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useGetProfileQuery,
  useLazyGetProfileQuery,
} from './authApi';

export {
  sosApi,
  useGetSOSListQuery,
  useCreateSOSMutation,
  useGetSOSByIdQuery,
  useUpdateSOSStatusMutation,
  useLazyGetSOSListQuery,
  useLazyGetSOSByIdQuery,
} from './sosApi';

export {
  resourceApi,
  useGetResourcesQuery,
  useGetResourceByIdQuery,
  useCreateResourceMutation,
  useUpdateResourceMutation,
  useDeleteResourceMutation,
  useLazyGetResourcesQuery,
  useLazyGetResourceByIdQuery,
} from './resourceApi';

export {
  alertApi,
  useGetAlertsQuery,
  useCreateAlertMutation,
  useGetAlertHistoryQuery,
  useMarkAlertAsReadMutation,
  useDeactivateAlertMutation,
  useLazyGetAlertsQuery,
  useLazyGetAlertHistoryQuery,
} from './alertApi';

export {
  dashboardApi,
  useGetCitizenDashboardQuery,
  useGetAdminDashboardQuery,
  useLazyGetCitizenDashboardQuery,
  useLazyGetAdminDashboardQuery,
} from './dashboardApi';


