# Custom Directus image that bakes the Google-picture hook into the extensions dir.
#
# Why baked, not bind-mounted: Coolify does not populate repo-relative bind mounts
# (`./extensions/...`) from the checkout — it creates empty host dirs — so the extension
# never reached the container and `[google-picture-url] hook loaded` never printed. Baking
# it into the image makes loading independent of any host mount. Directus uses its default
# EXTENSIONS_PATH (/directus/extensions); the compose no longer mounts anything over it.
FROM directus/directus:12.0.2

COPY --chown=node:node extensions/directus-extension-google-picture-url \
     /directus/extensions/directus-extension-google-picture-url
