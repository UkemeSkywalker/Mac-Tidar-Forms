# Everything here scales to zero: on-demand DynamoDB and Amplify SSR are
# billed per request, with nothing running while the app is idle.

provider "aws" {
  region = var.region
  default_tags {
    tags = {
      Project   = "mactidar-forms"
      ManagedBy = "terraform"
    }
  }
}

locals {
  name = "mactidar-forms"
}

resource "aws_dynamodb_table" "main" {
  name         = local.name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "PK"
  range_key    = "SK"

  attribute {
    name = "PK"
    type = "S"
  }
  attribute {
    name = "SK"
    type = "S"
  }
  attribute {
    name = "GSI1PK"
    type = "S"
  }
  attribute {
    name = "GSI1SK"
    type = "S"
  }

  global_secondary_index {
    name            = "GSI1"
    hash_key        = "GSI1PK"
    range_key       = "GSI1SK"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  deletion_protection_enabled = true
}

data "aws_iam_policy_document" "assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["amplify.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "compute" {
  name               = "${local.name}-app-compute"
  assume_role_policy = data.aws_iam_policy_document.assume.json
}

data "aws_iam_policy_document" "compute" {
  statement {
    actions = [
      "dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:DeleteItem",
      "dynamodb:Query", "dynamodb:BatchWriteItem", "dynamodb:ConditionCheckItem",
    ]
    resources = [aws_dynamodb_table.main.arn, "${aws_dynamodb_table.main.arn}/index/*"]
  }
}

resource "aws_iam_role_policy" "compute" {
  name   = "app-access"
  role   = aws_iam_role.compute.id
  policy = data.aws_iam_policy_document.compute.json
}

resource "random_password" "session" {
  length  = 64
  special = false
}

resource "aws_amplify_app" "this" {
  name             = local.name
  repository       = var.github_repository
  access_token     = var.github_access_token
  platform         = "WEB_COMPUTE"
  compute_role_arn = aws_iam_role.compute.arn

  # Build steps live in amplify.yml at the repo root.

  lifecycle {
    # The token is only needed to connect the repo on first create.
    ignore_changes = [access_token]
  }
}

resource "aws_amplify_branch" "main" {
  app_id            = aws_amplify_app.this.id
  branch_name       = var.production_branch
  framework         = "Next.js - SSR"
  stage             = "PRODUCTION"
  enable_auto_build = true

  environment_variables = {
    DATA_REGION    = var.region
    TABLE_NAME     = aws_dynamodb_table.main.name
    SESSION_SECRET = random_password.session.result
  }
}

# mactidar.com is on Namecheap BasicDNS, so the records in the outputs below
# are added there by hand.
resource "aws_amplify_domain_association" "this" {
  app_id                = aws_amplify_app.this.id
  domain_name           = var.domain_name
  wait_for_verification = false

  sub_domain {
    branch_name = aws_amplify_branch.main.branch_name
    prefix      = var.subdomain
  }
}
