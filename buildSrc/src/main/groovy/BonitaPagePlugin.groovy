import org.gradle.api.Plugin
import org.gradle.api.Project
import org.gradle.api.tasks.Copy

class BonitaPagePlugin implements Plugin<Project> {

    @Override
    void apply(Project project) {
        def extension = project.extensions.create('bonitaPage', BonitaPagePluginExtension)
        project.plugins.apply('com.moowork.node')
        project.plugins.apply('distribution')
        def currentDir = project.rootProject.projectDir


        project.node {
            download = true

            workDir = project.file("${currentDir}/.gradle/nodejs")
            npmWorkDir = project.file("${currentDir}/.gradle/npm")
            nodeModulesDir = project.file("${project.buildDir}/npmBuildDir")
        }

        project.afterEvaluate {
            project.node {
                version = extension.nodeVersion
                npmVersion = extension.npmVersion
            }
        }

        project.tasks.npm_install.configure {
            inputs.files('package.json', 'package-lock.json')
            outputs.dirs("${project.node.nodeModulesDir}/node_modules")
        }

        def prepareBuild = project.task([type: Copy], 'prepareBuild') {
            doFirst {
                project.node.nodeModulesDir.mkdir()
            }
            from('.') {
                exclude 'build'
            }
            into project.node.nodeModulesDir
        }

        project.tasks.npm_install.dependsOn prepareBuild

        def buildPage = project.task([type: com.moowork.gradle.node.npm.NpmTask, dependsOn: project.tasks.npm_install], 'buildPage') {
            args = ['run', 'build']
            inputs.files('package.json', 'package-lock.json')
            inputs.dir('src')
            outputs.dirs("${project.node.nodeModulesDir}/dist")
        }

        project.tasks.distZip.dependsOn buildPage

        def cleanNpm = project.task([:], 'cleanNpm') {
            doFirst {
                project.delete extension.frontendBuildDir
            }
        }

        project.tasks.clean.dependsOn cleanNpm

        project.distributions {
            main {
                contents {
                    from('resources') { into '/' }
                    from("${project.node.nodeModulesDir}/dist") {
                        into '/resources'
                    }
                }
            }
        }

    }

}
