# Environnement d'essai : Apache + PHP 8.3 avec le code de gestion/ (la base de données est un autre conteneur, voir docker-compose.yml).
FROM php:8.3-apache

RUN docker-php-ext-install pdo_mysql \
 && a2enmod headers \
 && printf 'ServerName localhost\nServerTokens Prod\nServerSignature Off\nLimitRequestBody 8388608\n<Directory /var/www/html>\n    AllowOverride All\n    Require all granted\n</Directory>\n' > /etc/apache2/conf-available/beauchemin.conf \
 && a2enconf beauchemin

COPY docker/docker-php.ini /usr/local/etc/php/conf.d/90-beauchemin.ini
COPY gestion/ /var/www/html/
COPY docker/docker-entrypoint.sh /usr/local/bin/beauchemin-entrypoint
RUN sed -i "s/\r$//" /usr/local/bin/beauchemin-entrypoint && chmod +x /usr/local/bin/beauchemin-entrypoint

ENTRYPOINT ["beauchemin-entrypoint"]
CMD ["apache2-foreground"]
