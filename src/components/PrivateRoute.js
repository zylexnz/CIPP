import { ApiGetCall } from "../api/ApiCall.jsx";
import UnauthenticatedPage from "../pages/unauthenticated.js";
import LoadingPage from "../pages/loading.js";
import ApiOfflinePage from "../pages/api-offline.js";
import { useState, useEffect, useRef } from "react";

const MAX_AUTH_ATTEMPTS = 3;

export const PrivateRoute = ({ children, routeType }) => {
  const [unauthLatched, setUnauthLatched] = useState(false);
  const [authAttempts, setAuthAttempts] = useState(0);
  const lastSettleRef = useRef(0);
  const authBudgetExhausted = authAttempts >= MAX_AUTH_ATTEMPTS;

  const session = ApiGetCall({
    url: "/.auth/me",
    queryKey: "authmeswa",
    waiting: !authBudgetExhausted,
    refetchOnWindowFocus: !authBudgetExhausted,
    staleTime: 120000, // 2 minutes
  });

  useEffect(() => {
    const settledAt = Math.max(session.dataUpdatedAt ?? 0, session.errorUpdatedAt ?? 0);
    if (session.isFetching || settledAt === 0 || settledAt === lastSettleRef.current) {
      return;
    }
    lastSettleRef.current = settledAt;
    if (session.isSuccess && session.data?.clientPrincipal) {
      setAuthAttempts(0);
    } else {
      setAuthAttempts((n) => Math.min(n + 1, MAX_AUTH_ATTEMPTS));
    }
  }, [
    session.isFetching,
    session.dataUpdatedAt,
    session.errorUpdatedAt,
    session.isSuccess,
    session.data,
  ]);

  // Latch the unauthenticated state so refetches from child components
  // don't flip us back to loading. Clear the latch when session succeeds (after login).
  useEffect(() => {
    if (
      !session.isLoading &&
      !session.isFetching &&
      (session.isError ||
        null === session?.data?.clientPrincipal ||
        session?.data === undefined)
    ) {
      setUnauthLatched(true);
    } else if (session.isSuccess && session.data?.clientPrincipal) {
      setUnauthLatched(false);
    }
  }, [session.isLoading, session.isFetching, session.isError, session.isSuccess, session.data]);

  const apiRoles = ApiGetCall({
    url: "/api/me",
    queryKey: "authmecipp",
    retry: 2,
    waiting: session.isSuccess && session.data?.clientPrincipal !== null,
  });

  if (unauthLatched || authBudgetExhausted) {
    return <UnauthenticatedPage />;
  }

  // Check if the session is still loading before determining authentication status
  if (
    session.isLoading ||
    apiRoles.isLoading ||
    (apiRoles.isFetching && (apiRoles.data === null || apiRoles.data === undefined))
  ) {
    return <LoadingPage />;
  }

  // Check if the API is offline (404 error from /api/me endpoint)
  // Or other network errors that would indicate API is unavailable
  if (
    apiRoles?.error?.response?.status === 404 || // API endpoint not found
    apiRoles?.error?.response?.status === 502 || // Bad Gateway
    apiRoles?.error?.response?.status === 503 || // Service Unavailable
    (apiRoles?.isSuccess && !apiRoles?.data) // No client principal data, indicating API might be offline
  ) {
    return <ApiOfflinePage />;
  }

  let roles = null;

  if (
    session?.isSuccess &&
    apiRoles?.isSuccess &&
    undefined !== apiRoles?.data?.clientPrincipal &&
    session?.data?.clientPrincipal?.userDetails &&
    apiRoles?.data?.clientPrincipal?.userDetails &&
    session?.data?.clientPrincipal?.userDetails !== apiRoles?.data?.clientPrincipal?.userDetails
  ) {
    // refetch the profile if the user details are different
    apiRoles.refetch();
  }

  if (null !== apiRoles?.data?.clientPrincipal && undefined !== apiRoles?.data) {
    roles = apiRoles?.data?.clientPrincipal?.userRoles ?? [];
  } else if (null === apiRoles?.data?.clientPrincipal || undefined === apiRoles?.data) {
    return <UnauthenticatedPage />;
  }
  if (null === roles) {
    return <UnauthenticatedPage />;
  } else {
    const blockedRoles = ["anonymous", "authenticated"];
    const userRoles = roles?.filter((role) => !blockedRoles.includes(role)) ?? [];
    const isAuthenticated = userRoles.length > 0 && !apiRoles?.error;
    const isAdmin = roles?.includes("admin") || roles?.includes("superadmin");
    if (routeType === "admin" && !isAdmin) {
      return <UnauthenticatedPage />;
    }

    if (!isAuthenticated) {
      return <UnauthenticatedPage />;
    }

    return children;
  }
};
