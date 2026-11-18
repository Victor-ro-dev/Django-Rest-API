from rest_framework.pagination import PageNumberPagination


class StandardResultsSetPagination(PageNumberPagination):
    """Paginação padrão configurável via query param `page_size`."""

    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class AvaliacaoSmallPagination(PageNumberPagination):
    """Paginação dedicada para listagem de avaliações aninhadas em um curso."""

    page_size = 5
    page_size_query_param = 'page_size'
    max_page_size = 50
