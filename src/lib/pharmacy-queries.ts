import { queryOptions } from "@tanstack/react-query"
import { getPharmacyPortal } from "./pharmacy.functions"

export const portalQueryOptions = () =>
  queryOptions({
    queryKey: ["pharmacy-portal"],
    queryFn: () => getPharmacyPortal(),
  })
