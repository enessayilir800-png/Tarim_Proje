from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Environment-backed application settings."""

    cache_db_path: str = ""
    appeears_api_url: str = "https://appeears.earthdatacloud.nasa.gov/api/"
    appeears_bearer_token: str = ""
    field_data_api_url: str = ""
    field_data_api_key: str = ""
    perenual_api_key: str = ""
    perenual_base_url: str = "https://perenual.com/api/v2"
    soilgrids_base_url: str = "https://rest.isric.org/soilgrids/v2.0/properties/query"
    open_meteo_base_url: str = "https://api.open-meteo.com/v1/forecast"
    nasa_power_base_url: str = "https://power.larc.nasa.gov/api/temporal/daily/point"
    nasa_firms_map_key: str = ""
    nex_gddp_api_url: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
