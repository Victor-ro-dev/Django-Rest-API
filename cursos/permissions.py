from rest_framework import permissions


class EhSuperUser(permissions.BasePermission):
    """Permite requisições DELETE apenas para superusuários."""

    def has_permission(self, request, view):
        if request.method == 'DELETE':
            return bool(request.user and request.user.is_superuser)
        return True
