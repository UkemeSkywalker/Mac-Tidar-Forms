variable "region" {
  type    = string
  default = "eu-west-1"
}

variable "domain_name" {
  type    = string
  default = "mactidar.com"
}

variable "subdomain" {
  type    = string
  default = "forms"
}

variable "github_repository" {
  type    = string
  default = "https://github.com/UkemeSkywalker/Mac-Tidar-Forms"
}

variable "production_branch" {
  type    = string
  default = "master"
}

variable "github_access_token" {
  type      = string
  sensitive = true
}
