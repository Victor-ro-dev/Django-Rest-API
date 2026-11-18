from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

from cursos.urls import auth_urlpatterns, router

urlpatterns = [
    path('api/v1/', include('cursos.urls')),
    path('api/v2/', include(router.urls)),
    path('api/v2/auth/', include(auth_urlpatterns)),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    path('admin/', admin.site.urls),
    path('auth/', include('rest_framework.urls')),
]
