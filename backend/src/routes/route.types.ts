import { Route, RouteDirection, RouteStop } from '@prisma/client';

export type ApiRouteDirection = 'outbound' | 'return';

export interface RouteResponse {
  id: string;
  name: string;
  direction: ApiRouteDirection;
  isActive: boolean;
  createdAt: Date;
}

export interface RouteStopResponse {
  id: string;
  routeId: string;
  name: string;
  orderIndex: number;
  estimatedOffsetMinutes: number;
  isActive: boolean;
}

export function toPrismaRouteDirection(direction: ApiRouteDirection): RouteDirection {
  return direction === 'return' ? RouteDirection.returnDirection : RouteDirection.outbound;
}

export function toApiRoute(route: Route): RouteResponse {
  return {
    id: route.id,
    name: route.name,
    direction: route.direction === RouteDirection.returnDirection ? 'return' : 'outbound',
    isActive: route.isActive,
    createdAt: route.createdAt
  };
}

export function toApiRouteStop(stop: RouteStop): RouteStopResponse {
  return {
    id: stop.id,
    routeId: stop.routeId,
    name: stop.name,
    orderIndex: stop.orderIndex,
    estimatedOffsetMinutes: stop.estimatedOffsetMinutes,
    isActive: stop.isActive
  };
}
