# Generated by Django 3.2.12 on 2022-04-12 10:11

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('sources', '0003_init_permissions'),
    ]

    operations = [
        migrations.AlterField(
            model_name='sourcescounter',
            name='id',
            field=models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID'),
        ),
    ]