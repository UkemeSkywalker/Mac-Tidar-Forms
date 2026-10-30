# Shares the existing MacTidar state bucket under its own key.
terraform {
  backend "s3" {
    bucket       = "mactidar-tfstate-831981619011"
    key          = "mactidar-forms/terraform.tfstate"
    region       = "af-south-1"
    encrypt      = true
    use_lockfile = true
  }
}
