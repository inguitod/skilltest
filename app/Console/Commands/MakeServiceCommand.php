<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

#[Signature('make:service {name : Service class name, e.g. UserService or Billing/InvoiceService}')]
#[Description('Create a new service class')]
class MakeServiceCommand extends Command
{
    public function handle(): int
    {
        $name = Str::replace('.php', '', (string) $this->argument('name'));
        $normalized = str_replace('/', '\\', $name);
        $class = Str::studly(class_basename($normalized));
        $subNamespace = Str::beforeLast($normalized, '\\');

        if ($subNamespace === $normalized) {
            $subNamespace = '';
        }

        $subPath = str_replace('\\', DIRECTORY_SEPARATOR, $subNamespace);
        $directory = app_path('Services' . ($subPath !== '' ? DIRECTORY_SEPARATOR . $subPath : ''));
        $path = $directory . DIRECTORY_SEPARATOR . $class . '.php';

        if (File::exists($path)) {
            $this->error("Service already exists at: {$path}");
            return self::FAILURE;
        }

        File::ensureDirectoryExists($directory);

        $namespace = 'App\\Services' . ($subNamespace !== '' ? '\\' . $subNamespace : '');
        $stub = <<<PHP
<?php

namespace {$namespace};

class {$class}
{
    public function __construct()
    {
        //
    }
}
PHP;

        File::put($path, $stub);
        $this->info("Service created: {$path}");

        return self::SUCCESS;
    }
}
