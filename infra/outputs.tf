output "default_url" {
  value = "https://${aws_amplify_branch.main.branch_name}.${aws_amplify_app.this.default_domain}"
}

output "app_id" {
  value = aws_amplify_app.this.id
}

output "dns_records_for_namecheap" {
  value = {
    certificate = aws_amplify_domain_association.this.certificate_verification_dns_record
    app         = one(aws_amplify_domain_association.this.sub_domain[*].dns_record)
  }
}
